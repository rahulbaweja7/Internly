import React, { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import config from '../config/config';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';

const POLL_INTERVAL_MS = 2000;
const POLL_TIMEOUT_MS = 120_000; // 2 min max wait

export function GmailIntegration({ onApplicationsFound }) {
  const [status, setStatus] = useState({ connected: false, lastConnected: null });
  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(false);
  const [adding, setAdding] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const pollTimerRef = useRef(null);
  const pollStartRef = useRef(null);

  const refreshStatus = async () => {
    try {
      const res = await axios.get(`${config.API_BASE_URL}/api/gmail/status`);
      setStatus(res.data);
    } catch (_) {}
  };

  useEffect(() => {
    refreshStatus();
    return () => clearTimeout(pollTimerRef.current);
  }, []);

  const connect = () => {
    window.location.href = `${config.API_BASE_URL}/api/gmail/auth`;
  };

  const disconnect = async () => {
    await axios.delete(`${config.API_BASE_URL}/api/gmail/disconnect`);
    setStatus({ connected: false, lastConnected: null });
    setApps([]);
  };

  const pollScan = async (scanId) => {
    if (Date.now() - pollStartRef.current > POLL_TIMEOUT_MS) {
      setLoading(false);
      toast.error('Scan timed out — please try again');
      return;
    }

    try {
      const res = await axios.get(`${config.API_BASE_URL}/api/gmail/scan/${scanId}`);
      const { state, applications, error: scanError } = res.data;

      if (state === 'completed') {
        setApps(applications || []);
        if (onApplicationsFound && (applications || []).length > 0) onApplicationsFound(applications);
        setLoading(false);
        if ((applications || []).length === 0) toast.info('No new applications found');
      } else if (state === 'failed') {
        setLoading(false);
        toast.error(scanError || 'Scan failed — please try again');
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
    setApps([]);
    clearTimeout(pollTimerRef.current);

    try {
      const res = await axios.post(`${config.API_BASE_URL}/api/gmail/scan`, {
        limit: 300,
        all: showAll ? 1 : 0,
      });

      const { scanId, state, applications } = res.data;

      // No Redis (dev) — response is synchronous
      if (state === 'completed') {
        setApps(applications || []);
        if (onApplicationsFound && (applications || []).length > 0) onApplicationsFound(applications);
        if ((applications || []).length === 0) toast.info('No new applications found');
        setLoading(false);
        return;
      }

      // Start polling
      pollStartRef.current = Date.now();
      pollTimerRef.current = setTimeout(() => pollScan(scanId), POLL_INTERVAL_MS);
    } catch (e) {
      setLoading(false);
      if (e.response?.status === 429) {
        const wait = e.response.data.retryAfter || 60;
        toast.error(`Please wait ${wait}s before scanning again`);
      } else {
        toast.error('Failed to start scan');
      }
    }
  };

  const addApplicationToTracker = async (a) => {
    try {
      setAdding(true);
      await axios.post(`${config.API_BASE_URL}/api/jobs`, {
        company: a.company,
        role: a.position,
        location: a.location || '',
        status: a.status,
        stipend: '',
        dateApplied: a.appliedDate,
        notes: `Imported from Gmail\nSubject: ${a.subject || ''}\nSnippet: ${a.snippet || ''}`,
        emailId: a.emailId,
        subject: a.subject,
      });
      setApps((prev) => prev.filter((x) => x.emailId !== a.emailId));
      if (onApplicationsFound) onApplicationsFound(['refresh']);
    } catch {
      toast.error('Failed to add application');
    } finally {
      setAdding(false);
    }
  };

  // Single POST /api/jobs/bulk replaces N sequential requests
  const addAll = async () => {
    if (!apps.length) return;
    setAdding(true);
    try {
      const jobs = apps.map((a) => ({
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

      setApps([]);
      if (onApplicationsFound) onApplicationsFound(['refresh']);

      const parts = [];
      if (created > 0) parts.push(`${created} added`);
      if (updated > 0) parts.push(`${updated} updated`);
      if (skipped > 0) parts.push(`${skipped} already tracked`);
      toast.success(parts.join(', ') || 'Done');
    } catch {
      toast.error('Failed to import applications');
    } finally {
      setAdding(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Gmail Integration
          {status.connected && <Badge variant="secondary">Connected</Badge>}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {!status.connected ? (
          <Button onClick={connect}>Connect Gmail</Button>
        ) : (
          <div className="flex flex-wrap gap-2 items-center">
            <Button variant="outline" onClick={scan} disabled={loading}>
              {loading ? 'Scanning…' : 'Scan Emails'}
            </Button>
            <label className="text-xs text-muted-foreground inline-flex items-center gap-2" title="Show all matches (including previously seen)">
              <input type="checkbox" checked={showAll} onChange={(e) => setShowAll(e.target.checked)} />
              Show all
            </label>
            <Button variant="outline" onClick={disconnect}>Disconnect</Button>
            {apps.length > 0 && (
              <Button onClick={addAll} disabled={adding}>
                {adding ? 'Adding…' : `Add All (${apps.length})`}
              </Button>
            )}
          </div>
        )}

        {loading && (
          <p className="text-sm text-muted-foreground animate-pulse">Scanning your inbox…</p>
        )}

        {apps.length > 0 && (
          <div className="space-y-2">
            {apps.map((a) => (
              <div key={a.emailId} className="p-3 border rounded">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="font-medium">{a.position}</div>
                    <div className="text-sm text-muted-foreground">{a.company}</div>
                    <div className="text-xs text-muted-foreground">Applied: {new Date(a.appliedDate).toLocaleDateString(undefined, { timeZone: 'UTC' })}</div>
                    {a.subject && <div className="text-xs text-muted-foreground mt-1 line-clamp-1">Subject: {a.subject}</div>}
                  </div>
                  <div className="shrink-0 flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => addApplicationToTracker(a)} disabled={adding}>Add</Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default GmailIntegration;
