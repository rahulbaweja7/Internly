import React, { useEffect, useState } from 'react';
import axios from 'axios';
import config from '../config/config';
import { Navbar } from './Navbar';
import { Clock, Building, Calendar, BarChart3 } from 'lucide-react';
import { getUsageMetrics, formatDuration } from '../lib/usageTracker';

export default function Activity() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const res = await axios.get(`${config.API_BASE_URL}/api/jobs`);
        const jobs = res.data || [];
        // Flatten statusHistory into timeline events, but only for actual status changes
        const timeline = [];
        for (const j of jobs) {
          const hist = Array.isArray(j.statusHistory) ? j.statusHistory : [];
          // Iterate in chronological order and only record changes
          let previousStatus = null;
          for (const h of hist) {
            const currentStatus = h.status || j.status;
            const isFirst = previousStatus === null;
            const isChange = previousStatus !== null && currentStatus !== previousStatus;
            // Skip initial 'Applied' noise; include first if it's not 'Applied' or any real change
            if ((isFirst && currentStatus !== 'Applied') || isChange) {
              timeline.push({
                jobId: j._id,
                company: j.company,
                role: j.role,
                status: currentStatus,
                at: h.at || j.updatedAt || j.createdAt,
                source: h.source || 'manual',
                subject: h.subject,
              });
            }
            previousStatus = currentStatus;
          }
        }
        timeline.sort((a, b) => new Date(b.at) - new Date(a.at));
        setEvents(timeline.slice(0, 100));
      } catch (e) {
        setError('Failed to load activity');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const usage = getUsageMetrics();

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="h-16" />
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <h1 className="text-2xl font-semibold text-foreground mb-4">My Activity</h1>

        {/* Usage summary */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div className="rounded-md border border-input bg-background p-4">
            <div className="text-sm text-muted-foreground">Applycation uses</div>
            <div className="text-2xl font-bold">{usage.uses}</div>
          </div>
          <div className="rounded-md border border-input bg-background p-4">
            <div className="text-sm text-muted-foreground">Time on app</div>
            <div className="text-2xl font-bold">{formatDuration(usage.totalMs)}</div>
          </div>
          <div className="rounded-md border border-input bg-background p-4">
            <div className="text-sm text-muted-foreground">Recent events</div>
            <div className="text-2xl font-bold">{events.length}</div>
          </div>
        </div>

        {loading && (
          <div className="rounded-md border border-input bg-background p-4 text-sm text-muted-foreground">Loading…</div>
        )}
        {error && (
          <div className="rounded-md border border-red-300 bg-red-50 p-4 text-sm text-red-700">{error}</div>
        )}

        {!loading && !error && (
          <div className="space-y-3">
            {events.length === 0 ? (
              <div className="rounded-md border border-input bg-background p-4 text-sm text-muted-foreground">
                No recent activity yet.
              </div>
            ) : (
              events.map((ev, idx) => (
                <div key={idx} className="rounded-md border border-input bg-background p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      <span className="font-medium">{ev.status}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      <span>{new Date(ev.at).toLocaleString()}</span>
                    </div>
                  </div>
                  <div className="mt-2 text-sm text-muted-foreground flex items-center gap-2">
                    <Building className="h-4 w-4" />
                    <span>{ev.company} — {ev.role}</span>
                  </div>
                  {ev.subject && (
                    <div className="mt-2 text-xs text-muted-foreground">Subject: {ev.subject}</div>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}


