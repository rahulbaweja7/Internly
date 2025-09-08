import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
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
  const [query, setQuery] = useState(params.get('q') || '');
  const pageSize = 25;
  const page = Math.max(1, parseInt(params.get('page') || '1', 10));
  const [editing, setEditing] = useState(null);
  const [layout, setLayout] = useState(() => (params.get('layout') === 'grid' ? 'grid' : 'list'));
  const [jumpPage, setJumpPage] = useState('');

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
    // Auth is via HttpOnly cookie; no token query parameter
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

  const scan = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${config.API_BASE_URL}/api/gmail/fetch-emails`, {
        params: { limit: 500, all: showAll ? 1 : 0 },
      });
      const list = res.data.applications || [];
      setApps(list);
      saveCache(list);
    } catch (e) {
      const msg = e?.response?.data?.error || e.message || 'Failed to fetch emails';
      alert(msg);
    } finally {
      setLoading(false);
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
      setApps((prev) => {
        const next = prev.filter((x) => x.emailId !== emailId);
        saveCache(next);
        return next;
      });
      await fetchJobs();
    } catch (e) {
      alert(e?.response?.data?.error || 'Failed to add application');
    } finally {
      setAdding(false);
    }
  };

  const addAll = async () => {
    if (!apps.length) return;
    setAdding(true);
    try {
      for (const a of filtered) {
        // eslint-disable-next-line no-await-in-loop
        await addOne(a);
      }
    } finally {
      setAdding(false);
    }
  };

  useEffect(() => {
    refreshStatus();
    fetchJobs();
    loadCache();
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
    <Card className="rounded-xl border border-white/10 bg-white/[0.04] backdrop-blur-md animate-pulse h-full">
      <CardContent className="p-4 min-h-[140px]">
        <div className="h-4 w-40 bg-white/10 rounded mb-2" />
        <div className="h-3 w-28 bg-white/10 rounded mb-1" />
        <div className="h-3 w-32 bg-white/10 rounded" />
      </CardContent>
    </Card>
  );

  return (
    <>
    <div className="min-h-screen relative bg-slate-950">
      <Navbar />
      {/* Aurora background accents */}
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-40 -right-32 h-[520px] w-[520px] rounded-full bg-gradient-to-br from-cyan-500/20 to-emerald-500/20 blur-3xl" />
        <div className="absolute -bottom-40 -left-24 h-[460px] w-[460px] rounded-full bg-gradient-to-br from-purple-500/15 to-blue-500/15 blur-3xl" />
      </div>
      <div className="h-16" />
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-r from-cyan-500/30 to-violet-500/30 flex items-center justify-center ring-1 ring-white/10">
              <Mail className="h-5 w-5 text-cyan-400" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-white/70 bg-clip-text text-transparent">Import from Gmail</h1>
              <p className="text-slate-300">Scan your mailbox to add jobs in seconds</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="inline-flex rounded-md border border-white/10 overflow-hidden bg-white/5">
              <button
                className={`px-3 py-1.5 text-xs transition-colors ${layout === 'list' ? 'bg-white/10 text-white' : 'hover:bg-white/10 text-slate-300'}`}
                onClick={() => setLayout('list')}
              >List</button>
              <button
                className={`px-3 py-1.5 text-xs transition-colors ${layout === 'grid' ? 'bg-white/10 text-white' : 'hover:bg-white/10 text-slate-300'}`}
                onClick={() => setLayout('grid')}
              >Grid</button>
            </div>
            <Button variant="outline" onClick={() => navigate('/dashboard')}>Back to Dashboard</Button>
          </div>
        </div>

        <div className="sticky top-16 z-10 rounded-2xl p-[1px] bg-gradient-to-r from-cyan-500/30 via-emerald-500/30 to-violet-500/30">
          <Card className="rounded-2xl border border-white/10 bg-white/[0.04] backdrop-blur-md">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2">Gmail Connection {status.connected && <Badge variant="secondary">Connected</Badge>}</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-3 items-center pb-4">
              {!status.connected ? (
                <Button onClick={connect}>Connect Gmail</Button>
              ) : (
                <>
                  <Button variant="outline" onClick={scan} disabled={loading}>{loading ? 'Scanning…' : 'Scan Emails'}</Button>
                  <label className="text-xs text-slate-300 inline-flex items-center gap-2">
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
                    Add All ({filtered.length})
                  </Button>
                  <Button variant="outline" onClick={disconnect}>Disconnect</Button>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="mt-4">
          {filtered.length === 0 ? (
            <Card className="rounded-2xl border border-white/10 bg-white/[0.04] backdrop-blur-md">
              <CardContent className="py-10 text-center text-slate-300">
                {loading ? 'Scanning…' : 'No detected applications yet. Click Scan Emails to begin.'}
              </CardContent>
            </Card>
          ) : (
            <div className={layout === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3' : 'space-y-3'}>
              {loading && (layout === 'grid' ?
                Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={`s-${i}`} />) :
                Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={`s-${i}`} />)
              )}
              {!loading && pageItems.map((a) => {
                const already = jobsEmailIds.has(a.emailId);
                return (
                  <Card key={a.emailId} className="relative rounded-xl border border-white/10 bg-white/[0.04] hover:bg-white/[0.06] transition-colors backdrop-blur-md h-full">
                    <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-cyan-400/70 via-emerald-400/70 to-violet-400/70 rounded-t-xl" />
                    <CardContent className="p-4 min-h-[140px] h-full flex flex-col">
                      <div className="flex items-start justify-between gap-3 flex-1">
                        <div>
                          <div className="font-medium clamp-1">{a.position || 'Unknown Position'}</div>
                          <div className="text-sm text-slate-300 clamp-1">{a.company || 'Unknown Company'}</div>
                          <div className="text-xs text-slate-300">Applied: {new Date(a.appliedDate).toLocaleDateString(undefined, { timeZone: 'UTC' })}</div>
                          {a.subject && <div className="text-xs text-slate-300 mt-1 clamp-1">Subject: {a.subject}</div>}
                        </div>
                        <div className="shrink-0 flex items-center gap-2">
                          <Button size="sm" variant="outline" onClick={() => setEditing(a)}>
                            Edit
                          </Button>
                          {already ? (
                            <Badge variant="outline">Already added</Badge>
                          ) : (
                            <Button size="sm" variant="outline" onClick={() => addOne(a)} disabled={adding}>Add</Button>
                          )}
                        </div>
                      </div>
                      {/* Spacer to ensure consistent bottom padding */}
                      <div className="mt-2" />
                    </CardContent>
                  </Card>
                );
              })}

              {/* Pagination */}
              <div className="rounded-md p-[1px] bg-gradient-to-r from-cyan-500/30 via-emerald-500/30 to-violet-500/30">
                <div className="flex items-center justify-between py-3 rounded-md border border-white/10 bg-white/[0.04] backdrop-blur-md px-3">
                  <div className="text-sm text-slate-300">
                    Showing <span className="text-foreground font-medium">{start + 1}-{Math.min(start + pageSize, filtered.length)}</span> of <span className="text-foreground font-medium">{filtered.length}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => setPage(1)} disabled={currentPage === 1} className="h-8 px-2"><ChevronsLeft className="h-4 w-4"/></Button>
                    <Button variant="outline" size="sm" onClick={() => setPage(currentPage - 1)} disabled={currentPage === 1} className="h-8 px-2"><ChevronLeft className="h-4 w-4"/></Button>
                    <div className="flex items-center gap-2 text-sm">
                      <span>Page</span>
                      <input
                        className="w-12 h-8 rounded-md border border-input bg-background px-2 text-center text-sm"
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
            </div>
          )}
        </div>
      </div>
    </div>
    {/* Edit Modal */}
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
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Applied">Applied</SelectItem>
                    <SelectItem value="Online Assessment">Online Assessment</SelectItem>
                    <SelectItem value="Interview">Interview</SelectItem>
                    <SelectItem value="Accepted">Accepted</SelectItem>
                    <SelectItem value="Rejected">Rejected</SelectItem>
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
                <Input placeholder="Optional" value={editing.notes || ''} onChange={(e) => setEditing((p) => ({ ...p, notes: e.target.value }))} />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => {
                // Persist edits locally and close
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


