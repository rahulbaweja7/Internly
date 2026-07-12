import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'sonner';
import config from '../config/config';
import { Navbar } from './Navbar';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { useAuth } from '../contexts/AuthContext';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Mail } from 'lucide-react';
import { trackEvent } from '../utils/analytics';
import { JOB_STATUSES } from '../constants/jobStatuses';

const POLL_INTERVAL_MS = 2000;
const POLL_TIMEOUT_MS = 120_000;

export default function ImportGmail() {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const { user } = useAuth();
  const [status, setStatus] = useState({ connected: false, lastConnected: null });
  const [apps, setApps] = useState([]);
  const [jobsEmailIds, setJobsEmailIds] = useState(() => new Set());
  const [loading, setLoading] = useState(false);
  const [adding, setAdding] = useState(false);
  const [showAll, setShowAll] = useState(params.get('all') === '1');
  const [startDate, setStartDate] = useState(params.get('from') || '');
  const [endDate, setEndDate] = useState(params.get('to') || '');
  const [query, setQuery] = useState(params.get('q') || '');
  const pageSize = 25;
  const page = Math.max(1, parseInt(params.get('page') || '1', 10));
  const [editing, setEditing] = useState(null);
  const [layout, setLayout] = useState(() => (params.get('layout') === 'grid' ? 'grid' : 'list'));
  const [jumpPage, setJumpPage] = useState('');
  const pollTimerRef = useRef(null);
  const pollStartRef = useRef(null);

  const storageKey = (suffix) => {
    const uid = (user?.id || user?._id || 'default').toString();
    return `gmail_import_${uid}_${suffix}`;
  };

  const saveCache = (list) => {
    try {
      localStorage.setItem(storageKey('apps_v1'), JSON.stringify(list || []));
      localStorage.setItem(storageKey('last_scan_at'), new Date().toISOString());
    } catch (_) {}
  };

  const loadCache = () => {
    try {
      const raw = localStorage.getItem(storageKey('apps_v1'));
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) setApps(parsed);
      }
    } catch (_) {}
  };

  const connect = () => {
    window.location.href = `${config.API_BASE_URL}/api/gmail/auth`;
  };

  const disconnect = async () => {
    await axios.delete(`${config.API_BASE_URL}/api/gmail/disconnect`);
    setStatus({ connected: false, lastConnected: null });
    setApps([]);
  };

  const refreshStatus = async () => {
    try {
      const res = await axios.get(`${config.API_BASE_URL}/api/gmail/status`);
      setStatus(res.data);
    } catch (_) {}
  };

  const fetchJobs = async () => {
    try {
      const res = await axios.get(`${config.API_BASE_URL}/api/jobs`);
      const ids = new Set();
      (res.data || []).forEach((j) => {
        if (j.emailId) ids.add(j.emailId);
        (j.statusHistory || []).forEach((h) => h.emailId && ids.add(h.emailId));
      });
      setJobsEmailIds(ids);
    } catch (_) {}
  };

  const pollScan = async (scanId) => {
    if (Date.now() - pollStartRef.current > POLL_TIMEOUT_MS) {
      setLoading(false);
      toast.error('Scan timed out — please try again');
      return;
    }
    try {
      const res = await axios.get(`${config.API_BASE_URL}/api/gmail/scan/${scanId}`);
      const { state, applications, requiresReconnect } = res.data;

      if (state === 'completed') {
        const list = applications || [];
        setApps(list);
        saveCache(list);
        trackEvent('gmail_scan_completed', { email_count: list.length });
        if (list.length === 0) toast.info('No new applications found');
        setLoading(false);
      } else if (state === 'failed') {
        setLoading(false);
        if (requiresReconnect) {
          await refreshStatus(); // triggers reconnect UI
        } else {
          toast.error('Scan failed — please try again');
        }
      } else {
        pollTimerRef.current = setTimeout(() => pollScan(scanId), POLL_INTERVAL_MS);
      }
    } catch {
      setLoading(false);
      toast.error('Scan failed — please try again');
    }
  };

  const scan = async () => {
    setLoading(true);
    clearTimeout(pollTimerRef.current);
    try {
      const body = { limit: 500, all: showAll ? 1 : 0 };
      if (startDate) body.startDate = startDate;
      if (endDate) body.endDate = endDate;
      const res = await axios.post(`${config.API_BASE_URL}/api/gmail/scan`, body);

      const { scanId, state, applications } = res.data;

      // No Redis (dev) — synchronous response
      if (state === 'completed') {
        const list = applications || [];
        setApps(list);
        saveCache(list);
        trackEvent('gmail_scan_completed', { email_count: list.length });
        if (list.length === 0) toast.info('No new applications found');
        setLoading(false);
        return;
      }

      pollStartRef.current = Date.now();
      pollTimerRef.current = setTimeout(() => pollScan(scanId), POLL_INTERVAL_MS);
    } catch (e) {
      setLoading(false);
      if (e.response?.data?.requiresReconnect) {
        await refreshStatus(); // triggers reconnect UI
      } else if (e.response?.status === 429) {
        const wait = e.response.data.retryAfter || 60;
        toast.error(`Please wait ${wait}s before scanning again`);
      } else {
        toast.error(e?.response?.data?.error || 'Failed to fetch emails');
      }
    }
  };

  const filtered = useMemo(() => {
    const q = (query || '').toLowerCase().trim();
    if (!q) return apps;
    return apps.filter((a) =>
      [a.company, a.position, a.subject, a.snippet]
        .filter(Boolean)
        .some((t) => String(t).toLowerCase().includes(q))
    );
  }, [apps, query]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const start = (currentPage - 1) * pageSize;
  const pageItems = filtered.slice(start, start + pageSize);

  const setPage = (p) => {
    const next = Math.max(1, Math.min(totalPages, p));
    setParams((old) => {
      old.set('page', String(next));
      if (showAll) old.set('all', '1'); else old.delete('all');
      if (query) old.set('q', query); else old.delete('q');
      if (layout === 'grid') old.set('layout', 'grid'); else old.delete('layout');
      return old;
    });
  };

  const addOne = async (a) => {
    try {
      setAdding(true);
      const { emailId, subject, snippet, company, position, status: s, appliedDate, location } = a;
      const already = jobsEmailIds.has(emailId);
      await axios.post(`${config.API_BASE_URL}/api/jobs`, {
        company,
        role: position,
        location: location || '',
        status: s,
        stipend: '',
        dateApplied: appliedDate,
        notes: `Imported from Gmail\nSubject: ${subject || ''}\nSnippet: ${snippet || ''}`,
        emailId,
        subject,
        ...(already ? { onlyUpdateStatusIfExists: true } : {}),
      });
      trackEvent('gmail_job_imported', { status: s, status_update_only: already });
      setApps((prev) => {
        const next = prev.filter((x) => x.emailId !== emailId);
        saveCache(next);
        return next;
      });
      await fetchJobs();
    } catch (e) {
      toast.error(e?.response?.data?.error || 'Failed to add application');
    } finally {
      setAdding(false);
    }
  };

  // Single POST /api/jobs/bulk replaces N sequential requests
  const addAll = async () => {
    if (!filtered.length) return;
    setAdding(true);
    try {
      const jobs = filtered.map((a) => ({
        company: a.company,
        role: a.position,
        location: a.location || '',
        status: a.status,
        stipend: '',
        dateApplied: a.appliedDate,
        notes: `Imported from Gmail\nSubject: ${a.subject || ''}\nSnippet: ${a.snippet || ''}`,
        emailId: a.emailId,
        subject: a.subject,
      }));

      const res = await axios.post(`${config.API_BASE_URL}/api/jobs/bulk`, { jobs });
      const { created, updated, skipped } = res.data;

      trackEvent('gmail_bulk_imported', { created, updated, skipped });
      setApps([]);
      saveCache([]);
      await fetchJobs();

      const parts = [];
      if (created > 0) parts.push(`${created} added`);
      if (updated > 0) parts.push(`${updated} updated`);
      if (skipped > 0) parts.push(`${skipped} already tracked`);
      toast.success(parts.join(', ') || 'Done');
    } catch (e) {
      toast.error(e?.response?.data?.error || 'Failed to import applications');
    } finally {
      setAdding(false);
    }
  };

  useEffect(() => {
    refreshStatus();
    fetchJobs();
    loadCache();
    return () => clearTimeout(pollTimerRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setParams((old) => {
      if (showAll) old.set('all', '1'); else old.delete('all');
      if (query) old.set('q', query); else old.delete('q');
      if (!old.get('page')) old.set('page', '1');
      if (layout === 'grid') old.set('layout', 'grid'); else old.delete('layout');
      return old;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showAll, query, layout]);

  const SkeletonCard = () => (
    <Card className="rounded-xl border border-border bg-card animate-pulse h-full">
      <CardContent className="p-4 min-h-[140px]">
        <div className="h-4 w-40 bg-muted rounded mb-2" />
        <div className="h-3 w-28 bg-muted rounded mb-1" />
        <div className="h-3 w-32 bg-muted rounded" />
      </CardContent>
    </Card>
  );

  return (
    <>
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="h-16" />
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-cyan-500/10 dark:bg-cyan-500/20 flex items-center justify-center ring-1 ring-cyan-500/20">
              <Mail className="h-5 w-5 text-cyan-500 dark:text-cyan-400" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-foreground">Import from Gmail</h1>
              <p className="text-sm text-muted-foreground">Scan your mailbox to add jobs in seconds</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="inline-flex rounded-md border border-border overflow-hidden bg-muted/40">
              <button
                className={`px-3 py-1.5 text-xs transition-colors ${layout === 'list' ? 'bg-background text-foreground shadow-sm' : 'hover:bg-muted text-muted-foreground'}`}
                onClick={() => setLayout('list')}
              >List</button>
              <button
                className={`px-3 py-1.5 text-xs transition-colors ${layout === 'grid' ? 'bg-background text-foreground shadow-sm' : 'hover:bg-muted text-muted-foreground'}`}
                onClick={() => setLayout('grid')}
              >Grid</button>
            </div>
            <Button variant="outline" onClick={() => navigate('/dashboard')}>Back to Dashboard</Button>
          </div>
        </div>

        <div className="sticky top-16 z-10">
          <Card className="rounded-2xl border border-border bg-card">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">Gmail Connection {status.connected && <Badge variant="secondary">Connected</Badge>}</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-3 items-center pb-4">
              {!status.connected ? (
                <Button onClick={connect}>Connect Gmail</Button>
              ) : status.needsReconnect ? (
                <div className="rounded-md border border-amber-500/40 bg-amber-500/10 p-3 space-y-2">
                  <p className="text-sm text-amber-600 dark:text-amber-300 font-medium">Your Gmail connection has expired.</p>
                  <p className="text-xs text-amber-500 dark:text-amber-400">Click below to reconnect and resume scanning.</p>
                  <Button onClick={connect} size="sm">Reconnect Gmail</Button>
                </div>
              ) : (
                <div className="w-full space-y-3">
                  <div className="flex flex-wrap gap-3 items-center">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs text-muted-foreground whitespace-nowrap">From</span>
                      <input
                        type="date"
                        value={startDate}
                        max={endDate || undefined}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="text-xs border border-input rounded px-2 py-1 bg-background text-foreground w-36"
                      />
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs text-muted-foreground whitespace-nowrap">To</span>
                      <input
                        type="date"
                        value={endDate}
                        min={startDate || undefined}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="text-xs border border-input rounded px-2 py-1 bg-background text-foreground w-36"
                      />
                    </div>
                    {(startDate || endDate) && (
                      <button
                        onClick={() => { setStartDate(''); setEndDate(''); }}
                        className="text-xs text-muted-foreground underline"
                      >
                        Clear dates
                      </button>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-3 items-center">
                    <Button variant="outline" onClick={scan} disabled={loading}>{loading ? 'Scanning…' : 'Scan Emails'}</Button>
                    <label className="text-xs text-muted-foreground inline-flex items-center gap-2">
                      <input type="checkbox" checked={showAll} onChange={(e) => setShowAll(e.target.checked)} />
                      Show all
                    </label>
                    <Input
                      placeholder="Search detected applications…"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      className="w-72"
                    />
                    <Button onClick={addAll} disabled={adding || filtered.length === 0}>
                      {adding ? 'Adding…' : `Add All (${filtered.length})`}
                    </Button>
                    <Button variant="outline" onClick={disconnect}>Disconnect</Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="mt-4">
          {filtered.length === 0 ? (
            <Card className="rounded-2xl border border-border bg-card">
              <CardContent className="py-10 text-center text-muted-foreground">
                {loading ? 'Scanning your inbox…' : 'No detected applications yet. Click Scan Emails to begin.'}
              </CardContent>
            </Card>
          ) : (
            <div className={layout === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3' : 'space-y-3'}>
              {loading && Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={`s-${i}`} />)}
              {!loading && pageItems.map((a) => {
                const already = jobsEmailIds.has(a.emailId);
                return (
                  <Card key={a.emailId} className="relative rounded-xl border border-border bg-card hover:bg-accent/30 transition-colors h-full">
                    <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-cyan-400/60 via-emerald-400/60 to-violet-400/60 rounded-t-xl" />
                    <CardContent className="p-4 min-h-[120px] h-full flex flex-col">
                      <div className="flex items-start justify-between gap-3 flex-1">
                        <div className="min-w-0">
                          <div className="font-medium text-foreground truncate">{a.position || 'Unknown Position'}</div>
                          <div className="text-sm text-muted-foreground truncate">{a.company || 'Unknown Company'}</div>
                          <div className="text-xs text-muted-foreground mt-0.5">Applied: {new Date(a.appliedDate).toLocaleDateString(undefined, { timeZone: 'UTC' })}</div>
                          {a.subject && <div className="text-xs text-muted-foreground/70 mt-1 truncate">Subject: {a.subject}</div>}
                        </div>
                        <div className="shrink-0 flex items-center gap-2">
                          <Button size="sm" variant="outline" onClick={() => setEditing(a)}>Edit</Button>
                          {already ? (
                            <Badge variant="outline">Already added</Badge>
                          ) : (
                            <Button size="sm" variant="outline" onClick={() => addOne(a)} disabled={adding}>Add</Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}

              <div className="flex items-center justify-between py-3 rounded-xl border border-border bg-card px-4">
                <div className="text-sm text-muted-foreground">
                  Showing <span className="text-foreground font-medium">{start + 1}–{Math.min(start + pageSize, filtered.length)}</span> of <span className="text-foreground font-medium">{filtered.length}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => setPage(1)} disabled={currentPage === 1} className="h-8 px-2"><ChevronsLeft className="h-4 w-4"/></Button>
                  <Button variant="outline" size="sm" onClick={() => setPage(currentPage - 1)} disabled={currentPage === 1} className="h-8 px-2"><ChevronLeft className="h-4 w-4"/></Button>
                  <div className="flex items-center gap-2 text-sm">
                    <span>Page</span>
                    <input
                      className="w-12 h-8 rounded-md border border-input bg-background text-foreground px-2 text-center text-sm"
                      value={jumpPage}
                      onChange={(e) => setJumpPage(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          const n = parseInt(jumpPage, 10);
                          if (!isNaN(n)) setPage(n);
                        }
                      }}
                      placeholder={String(currentPage)}
                    />
                    <span>/ {totalPages}</span>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => setPage(currentPage + 1)} disabled={currentPage >= totalPages} className="h-8 px-2"><ChevronRight className="h-4 w-4"/></Button>
                  <Button variant="outline" size="sm" onClick={() => setPage(totalPages)} disabled={currentPage >= totalPages} className="h-8 px-2"><ChevronsRight className="h-4 w-4"/></Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>

    {editing && (
      <Dialog open={true} onOpenChange={() => setEditing(null)}>
        <DialogContent className="sm:max-w-[840px]">
          <DialogHeader>
            <DialogTitle>Edit Application</DialogTitle>
          </DialogHeader>
          <div className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Company</Label>
                <Input value={editing.company}
                  onChange={(e) => setEditing((p) => ({ ...p, company: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Position</Label>
                <Input value={editing.position}
                  onChange={(e) => setEditing((p) => ({ ...p, position: e.target.value }))} />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={editing.status} onValueChange={(v) => setEditing((p) => ({ ...p, status: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {JOB_STATUSES.map((s) => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Application Date</Label>
                <Input type="date" value={editing.appliedDate}
                  onChange={(e) => setEditing((p) => ({ ...p, appliedDate: e.target.value }))} />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Location</Label>
                <Input value={editing.location || ''}
                  onChange={(e) => setEditing((p) => ({ ...p, location: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Notes</Label>
                <Input placeholder="Optional" value={editing.notes || ''}
                  onChange={(e) => setEditing((p) => ({ ...p, notes: e.target.value }))} />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => {
                setApps((prev) => {
                  const next = prev.map((x) => x.emailId === editing.emailId ? editing : x);
                  saveCache(next);
                  return next;
                });
                setEditing(null);
              }}>Save</Button>
              <Button onClick={async () => {
                const data = editing;
                setEditing(null);
                await addOne(data);
              }} disabled={adding}>Save & Add</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    )}
    </>
  );
}
