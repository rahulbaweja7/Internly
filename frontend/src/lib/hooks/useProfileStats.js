import React from 'react';
import { useData } from '../../contexts/DataContext';

export function useProfileStats() {
  const { jobs, loading, error, refresh } = useData();

  const countLastNDays = React.useMemo(() => (days) => {
    const since = Date.now() - days * 24 * 60 * 60 * 1000;
    return jobs.reduce((acc, j) => {
      const t = new Date(j.dateApplied || j.appliedDate || j.createdAt).getTime();
      return acc + (isNaN(t) ? 0 : (t >= since ? 1 : 0));
    }, 0);
  }, [jobs]);

  const streak = React.useMemo(() => {
    const dates = new Set();
    const format = (d) => {
      const dt = new Date(d); dt.setHours(0, 0, 0, 0);
      const y = dt.getFullYear();
      const m = String(dt.getMonth() + 1).padStart(2, '0');
      const da = String(dt.getDate()).padStart(2, '0');
      return `${y}-${m}-${da}`;
    };
    jobs.forEach((j) => {
      const raw = j.dateApplied || j.appliedDate || j.createdAt;
      if (raw) dates.add(format(raw));
    });
    if (dates.size === 0) return 0;
    const probe = new Date(); probe.setHours(0, 0, 0, 0);
    let count = 0;
    while (true) {
      const key = format(probe);
      if (dates.has(key)) { count += 1; probe.setDate(probe.getDate() - 1); }
      else break;
    }
    return count;
  }, [jobs]);

  return {
    loading,
    error,
    jobs,
    total: jobs.length,
    last7: countLastNDays(7),
    last30: countLastNDays(30),
    streak,
    refresh,
  };
}
