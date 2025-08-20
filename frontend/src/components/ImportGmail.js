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
    <Card className="rounded-xl border border-border/80 bg-gradient-to-b from-background/70 to-background/30 backdrop-blur animate-pulse">
      <CardContent className="p-4">
        <div className="h-4 w-40 bg-muted/40 rounded mb-2" />
        <div className="h-3 w-28 bg-muted/30 rounded mb-1" />
        <div className="h-3 w-32 bg-muted/20 rounded" />
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
            <div className="h-9 w-9 rounded-xl bg-gradient-to-r from-blue-500/20 to-purple-500/20 flex items-center justify-center ring-1 ring-border" />
            <div>
              <h1 className="text-3xl font-bold">Import from Gmail</h1>
              <p className="text-muted-foreground">Scan your mailbox to add jobs in seconds</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="inline-flex rounded-md border border-border overflow-hidden">
              <button
                className={`px-3 py-1.5 text-xs ${layout === 'list' ? 'bg-muted/30' : 'hover:bg-muted/10'}`}
                onClick={() => setLayout('list')}
              >List</button>
              <button
                className={`px-3 py-1.5 text-xs ${layout === 'grid' ? 'bg-muted/30' : 'hover:bg-muted/10'}`}
                onClick={() => setLayout('grid')}
              >Grid</button>
            </div>
            <Button variant="outline" onClick={() => navigate('/dashboard')}>Back to Dashboard</Button>
          </div>
        </div>

        <Card className="rounded-2xl border border-border/80 bg-gradient-to-b from-background/80 to-background/40 backdrop-blur sticky top-16 z-10">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2">Gmail Connection {status.connected && <Badge variant="secondary">Connected</Badge>}</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-3 items-center pb-4">
            {!status.connected ? (
              <Button onClick={connect}>Connect Gmail</Button>
            ) : (
              <>
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
                  Add All ({filtered.length})
                </Button>
                <Button variant="outline" onClick={disconnect}>Disconnect</Button>
              </>
            )}
          </CardContent>
        </Card>

        <div className="mt-4">
          {filtered.length === 0 ? (
            <Card className="rounded-2xl border border-border/80 bg-gradient-to-b from-background/80 to-background/40 backdrop-blur">
              <CardContent className="py-10 text-center text-muted-foreground">
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
                  <Card key={a.emailId} className="rounded-xl border border-border/80 bg-gradient-to-b from-background/80 to-background/40 backdrop-blur">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="font-medium">{a.position || 'Unknown Position'}</div>
                          <div className="text-sm text-muted-foreground">{a.company || 'Unknown Company'}</div>
                          <div className="text-xs text-muted-foreground">Applied: {new Date(a.appliedDate).toLocaleDateString(undefined, { timeZone: 'UTC' })}</div>
                          {a.subject && <div className="text-xs text-muted-foreground mt-1 line-clamp-1">Subject: {a.subject}</div>}
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
                    </CardContent>
                  </Card>
                );
              })}

              {/* Pagination */}
              <div className="flex items-center justify-between py-2">
                <div className="text-sm text-muted-foreground">
                  Showing {start + 1}-{Math.min(start + pageSize, filtered.length)} of {filtered.length}
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => setPage(1)} disabled={currentPage === 1}>First</Button>
                  <Button variant="outline" size="sm" onClick={() => setPage(currentPage - 1)} disabled={currentPage === 1}>Prev</Button>
                  <div className="text-sm px-2">Page {currentPage} / {totalPages}</div>
                  <Button variant="outline" size="sm" onClick={() => setPage(currentPage + 1)} disabled={currentPage >= totalPages}>Next</Button>
                  <Button variant="outline" size="sm" onClick={() => setPage(totalPages)} disabled={currentPage >= totalPages}>Last</Button>
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
        <DialogContent className="sm:max-w-[520px]">
          <DialogHeader>
            <DialogTitle>Edit Application</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
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
            <div className="space-y-2">
              <Label>Location</Label>
              <Input value={editing.location || ''}
                onChange={(e) => setEditing((p) => ({ ...p, location: e.target.value }))} />
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


