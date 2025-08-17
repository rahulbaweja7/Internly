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

  const refreshStatus = async () => {
    try {
      const res = await axios.get(`${config.API_BASE_URL}/api/gmail/status`);
      setStatus(res.data);
    } catch (_) {}
  };

  useEffect(() => { refreshStatus(); }, []);

  const connect = () => {
    const token = localStorage.getItem('token');
    const url = token
      ? `${config.API_BASE_URL}/api/gmail/auth?t=${encodeURIComponent(token)}`
      : `${config.API_BASE_URL}/api/gmail/auth`;
    window.location.href = url;
  };

  const disconnect = async () => {
    await axios.delete(`${config.API_BASE_URL}/api/gmail/disconnect`);
    setStatus({ connected: false, lastConnected: null });
    setApps([]);
  };

  const scan = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${config.API_BASE_URL}/api/gmail/fetch-emails`, { params: { limit: 300 } });
      setApps(res.data.applications || []);
      if (onApplicationsFound && (res.data.applications || []).length > 0) onApplicationsFound(res.data.applications);
    } finally {
      setLoading(false);
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
          <div className="flex gap-2">
            <Button variant="outline" onClick={scan} disabled={loading}>{loading ? 'Scanning…' : 'Scan Emails'}</Button>
            <Button variant="outline" onClick={disconnect}>Disconnect</Button>
          </div>
        )}

        {apps.length > 0 && (
          <div className="space-y-2">
            {apps.map((a) => (
              <div key={a.emailId} className="p-3 border rounded">
                <div className="font-medium">{a.position}</div>
                <div className="text-sm text-muted-foreground">{a.company}</div>
                <div className="text-xs text-muted-foreground">Applied: {new Date(a.appliedDate).toLocaleDateString()}</div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default GmailIntegration;


