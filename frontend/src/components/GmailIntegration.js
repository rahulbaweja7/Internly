import React, { useEffect, useState } from 'react';
import axios from 'axios';
import config from '../config/config';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';

export function GmailIntegration({ onApplicationsFound }) {
  const [status, setStatus] = useState({ connected: false, lastConnected: null });
  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(false);
  const [adding, setAdding] = useState(false);
  const [showAll, setShowAll] = useState(false);

  const refreshStatus = async () => {
    try {
      const res = await axios.get(`${config.API_BASE_URL}/api/gmail/status`);
      setStatus(res.data);
    } catch (_) {}
  };

  useEffect(() => { refreshStatus(); }, []);

  const connect = () => {
    // Auth is via HttpOnly cookie; no token in URL
    window.location.href = `${config.API_BASE_URL}/api/gmail/auth`;
  };

  const disconnect = async () => {
    await axios.delete(`${config.API_BASE_URL}/api/gmail/disconnect`);
    setStatus({ connected: false, lastConnected: null });
    setApps([]);
  };

  const scan = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${config.API_BASE_URL}/api/gmail/fetch-emails`, { params: { limit: 300, all: showAll ? 1 : 0 } });
      setApps(res.data.applications || []);
      if (onApplicationsFound && (res.data.applications || []).length > 0) onApplicationsFound(res.data.applications);
    } finally {
      setLoading(false);
    }
  };

  const addApplicationToTracker = async (a) => {
    try {
      setAdding(true);
      const { emailId, subject, snippet, company, position, status, appliedDate, location } = a;
      await axios.post(`${config.API_BASE_URL}/api/jobs`, {
        company,
        role: position,
        location: location || '',
        status,
        stipend: '',
        dateApplied: appliedDate,
        notes: `Imported from Gmail\nSubject: ${subject || ''}\nSnippet: ${snippet || ''}`,
        emailId,
        subject,
      });
      setApps((prev) => prev.filter((x) => x.emailId !== emailId));
      if (onApplicationsFound) onApplicationsFound(['refresh']);
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error('Add application failed', e);
      alert('Failed to add application');
    } finally {
      setAdding(false);
    }
  };

  const addAll = async () => {
    if (!apps.length) return;
    setAdding(true);
    try {
      for (const a of apps) {
        // Fire sequentially to avoid rate limits and keep order deterministic
        // eslint-disable-next-line no-await-in-loop
        await addApplicationToTracker(a);
      }
      if (onApplicationsFound) onApplicationsFound(['refresh']);
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
            <Button variant="outline" onClick={scan} disabled={loading}>{loading ? 'Scanning…' : 'Scan Emails'}</Button>
            <label className="text-xs text-muted-foreground inline-flex items-center gap-2" title="Show all matches (including previously seen)">
              <input type="checkbox" checked={showAll} onChange={(e) => setShowAll(e.target.checked)} />
              Show all
            </label>
            <Button variant="outline" onClick={disconnect}>Disconnect</Button>
            {apps.length > 0 && (
              <Button onClick={addAll} disabled={adding}>Add All ({apps.length})</Button>
            )}
          </div>
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


