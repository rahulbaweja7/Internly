import React, { useEffect, useState } from 'react';
import { Navbar } from './Navbar';
import { Activity as ActivityIcon, Clock, Zap, TrendingUp } from 'lucide-react';
import { getUsageMetrics, formatDuration } from '../lib/usageTracker';
import { useData } from '../contexts/DataContext';
import { STATUS_BADGE_CLASS } from '../constants/jobStatuses';

// Timeline dot colors only — solid fills, legible in both themes. Badge
// colors come from the shared, theme-aware STATUS_BADGE_CLASS so they
// don't repeat the light-mode-illegible pastel map that JobCard had.
const STATUS_DOT = {
  'Applied':             'bg-blue-500',
  'Online Assessment':   'bg-violet-500',
  'Phone Interview':     'bg-amber-500',
  'Technical Interview': 'bg-orange-500',
  'Final Interview':     'bg-rose-500',
  'Accepted':            'bg-emerald-500',
  'Rejected':            'bg-red-500',
  'Waitlisted':          'bg-yellow-500',
  'Withdrawn':           'bg-gray-500',
};

const DEFAULT_DOT = 'bg-muted-foreground/40';
const DEFAULT_BADGE = 'bg-muted text-muted-foreground';

function relativeTime(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

function groupByDate(events) {
  const groups = [];
  const seen = new Map();
  for (const ev of events) {
    const d = new Date(ev.at);
    const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
    if (!seen.has(key)) {
      const label = (() => {
        const today = new Date();
        const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1);
        if (d.toDateString() === today.toDateString()) return 'Today';
        if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
        return d.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' });
      })();
      seen.set(key, { label, events: [] });
      groups.push(seen.get(key));
    }
    seen.get(key).events.push(ev);
  }
  return groups;
}

export default function Activity() {
  const { jobs, loading } = useData();
  const [events, setEvents] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!loading && jobs) {
      try {
        const timeline = [];
        for (const j of jobs) {
          const hist = Array.isArray(j.statusHistory) ? j.statusHistory : [];
          let previousStatus = null;
          for (const h of hist) {
            const currentStatus = h.status || j.status;
            const isFirst = previousStatus === null;
            const isChange = previousStatus !== null && currentStatus !== previousStatus;
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
      } catch {
        setError('Failed to load activity');
      }
    }
  }, [jobs, loading]);

  const usage = getUsageMetrics();
  const groups = groupByDate(events);

  const stats = [
    { icon: Zap, label: 'App opens', value: usage.uses },
    { icon: Clock, label: 'Time on app', value: formatDuration(usage.totalMs) },
    { icon: TrendingUp, label: 'Status updates', value: events.length },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="h-16" />
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-foreground">Activity</h1>
          <p className="text-sm text-muted-foreground mt-1">Your recent application updates</p>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-3 mb-8">
          {stats.map(({ icon: Icon, label, value }) => (
            <div key={label} className="rounded-xl border border-border bg-card p-4">
              <Icon className="h-4 w-4 text-muted-foreground mb-2" />
              <div className="text-xl font-semibold text-foreground">{value}</div>
              <div className="text-xs text-muted-foreground mt-0.5">{label}</div>
            </div>
          ))}
        </div>

        {/* Timeline */}
        {loading && (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 rounded-xl bg-muted/40 animate-pulse" />
            ))}
          </div>
        )}

        {error && (
          <div className="rounded-xl border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/30 p-4 text-sm text-red-600 dark:text-red-400">
            {error}
          </div>
        )}

        {!loading && !error && events.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <ActivityIcon className="h-10 w-10 text-muted-foreground/30 mb-4" />
            <p className="text-sm font-medium text-foreground">No activity yet</p>
            <p className="text-xs text-muted-foreground mt-1">Status changes will appear here as you update your applications.</p>
          </div>
        )}

        {!loading && !error && groups.length > 0 && (
          <div className="space-y-6">
            {groups.map((group) => (
              <div key={group.label}>
                {/* Date label */}
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-xs font-medium text-muted-foreground">{group.label}</span>
                  <div className="flex-1 h-px bg-border" />
                </div>

                {/* Events for this date */}
                <div className="relative">
                  {/* Vertical line */}
                  <div className="absolute left-[7px] top-2 bottom-2 w-px bg-border" />

                  <div className="space-y-1">
                    {group.events.map((ev, idx) => {
                      const dotClass = STATUS_DOT[ev.status] || DEFAULT_DOT;
                      return (
                        <div key={idx} className="flex gap-4 group">
                          {/* Dot */}
                          <div className="relative flex-shrink-0 mt-[18px]">
                            <div className={`w-3.5 h-3.5 rounded-full ring-2 ring-background ${dotClass}`} />
                          </div>

                          {/* Card */}
                          <div className="flex-1 rounded-xl border border-border bg-card px-4 py-3 mb-2 hover:bg-accent/30 transition-colors">
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0">
                                <div className="text-sm font-medium text-foreground truncate">{ev.company}</div>
                                {ev.role && (
                                  <div className="text-xs text-muted-foreground truncate">{ev.role}</div>
                                )}
                              </div>
                              <div className="flex-shrink-0 flex flex-col items-end gap-1.5">
                                <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_BADGE_CLASS[ev.status] || DEFAULT_BADGE}`}>
                                  {ev.status}
                                </span>
                                <span className="text-[11px] text-muted-foreground/70">{relativeTime(ev.at)}</span>
                              </div>
                            </div>
                            {ev.subject && (
                              <div className="mt-1.5 text-xs text-muted-foreground/70 truncate">
                                {ev.subject}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
