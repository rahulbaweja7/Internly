import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { useLeaderboard } from '../lib/hooks/useLeaderboard';
import config from '../config/config';

function Sparkline({ points }) {
  if (!points || points.length === 0) return null;
  const max = Math.max(...points.map((p) => p.count), 1);
  const width = 80;
  const height = 24;
  const step = points.length > 1 ? width / (points.length - 1) : width;
  const d = points
    .map((p, i) => {
      const x = i * step;
      const y = height - (p.count / max) * height;
      return `${i === 0 ? 'M' : 'L'}${x},${y}`;
    })
    .join(' ');
  return (
    <svg width={width} height={height} className="text-primary">
      <path d={d} stroke="currentColor" strokeWidth="2" fill="none" />
    </svg>
  );
}

function Board({ title, rows }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {rows.length === 0 && <p className="text-sm text-muted-foreground">No data yet</p>}
        <ul className="space-y-3">
          {rows.map((r, idx) => (
            <li key={r.userId || idx} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {r.user?.picture ? (
                  <img src={r.user.picture} alt={r.user?.name} className="h-8 w-8 rounded-full" />
                ) : (
                  <div className="h-8 w-8 rounded-full bg-gray-300" />
                )}
                <div>
                  <div className="font-medium">{r.user?.name || 'User'}</div>
                  <div className="text-xs text-muted-foreground">{r.total} this period</div>
                </div>
              </div>
              <Sparkline points={(r.weeks || []).sort((a, b) => new Date(a.week) - new Date(b.week))} />
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

export default function Leaderboards() {
  const { loading, error, friends, global, refresh } = useLeaderboard(config.API_BASE_URL);
  const [weeks, setWeeks] = React.useState(4);
  const [tab, setTab] = React.useState('friends');

  return (
    <div className="container mx-auto px-6 py-8">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Leaderboards</h1>
        <div className="flex items-center gap-2">
          <select
            value={weeks}
            onChange={(e) => {
              const w = Number(e.target.value);
              setWeeks(w);
              refresh(w);
            }}
            className="border rounded px-2 py-1 bg-white dark:bg-gray-900"
          >
            {[2,4,8,12].map((w) => (
              <option key={w} value={w}>{w} weeks</option>
            ))}
          </select>
          <Button onClick={() => refresh(weeks)} variant="ghost">Refresh</Button>
        </div>
      </div>

      <div className="flex gap-2 mb-6">
        <Button onClick={() => setTab('friends')} variant={tab === 'friends' ? 'default' : 'ghost'}>Friends</Button>
        <Button onClick={() => setTab('global')} variant={tab === 'global' ? 'default' : 'ghost'}>Global</Button>
      </div>

      {loading && <p className="text-sm text-muted-foreground">Loading…</p>}
      {error && <p className="text-sm text-red-500">Failed to load</p>}

      {!loading && (
        tab === 'friends' ? (
          <Board title="Friends" rows={friends} />
        ) : (
          <Board title="Global" rows={global} />
        )
      )}
    </div>
  );
}


