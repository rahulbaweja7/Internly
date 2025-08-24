import React from 'react';
import config from '../../config/config';
import { cachedApiCall } from '../utils';

export function useProfileStats(userId) {
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);
  const [jobs, setJobs] = React.useState([]);
  const [rankFriends, setRankFriends] = React.useState(null);
  const [rankGlobal, setRankGlobal] = React.useState(null);
  const [lastFetch, setLastFetch] = React.useState(0);

  const fetchAll = React.useCallback(async (force = false) => {
    // Cache for 30 seconds to avoid excessive API calls
    const now = Date.now();
    if (!force && now - lastFetch < 30000) {
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const [jobsRes, friendsRes, globalRes] = await Promise.all([
        cachedApiCall(`${config.API_BASE_URL}/api/jobs?summary=1`),
        cachedApiCall(`${config.API_BASE_URL}/api/leaderboard/friends?weeks=4`).catch(() => ({ leaderboard: [] })),
        cachedApiCall(`${config.API_BASE_URL}/api/leaderboard/global?weeks=4`).catch(() => ({ leaderboard: [] })),
      ]);
      setJobs(Array.isArray(jobsRes) ? jobsRes : []);
      const findRank = (board) => {
        const idx = (board.leaderboard || []).findIndex((row) => String(row.userId) === String(userId));
        return idx >= 0 ? idx + 1 : null;
      };
      setRankFriends(findRank(friendsRes));
      setRankGlobal(findRank(globalRes));
      setLastFetch(now);
    } catch (e) {
      setError(e);
    } finally {
      setLoading(false);
    }
  }, [userId, lastFetch]);

  React.useEffect(() => {
    if (userId) fetchAll();
  }, [fetchAll, userId]);

  // Helpers
  const countLastNDays = React.useMemo(() => (days) => {
    const since = Date.now() - days * 24 * 60 * 60 * 1000;
    return jobs.reduce((acc, j) => {
      const t = new Date(j.dateApplied || j.appliedDate || j.createdAt).getTime();
      return acc + (isNaN(t) ? 0 : (t >= since ? 1 : 0));
    }, 0);
  }, [jobs]);

  const total = jobs.length;
  const last7 = countLastNDays(7);
  const last30 = countLastNDays(30);

  const streak = React.useMemo(() => {
    const dates = new Set();
    const format = (d) => {
      const dt = new Date(d); dt.setHours(0,0,0,0);
      const y = dt.getFullYear();
      const m = String(dt.getMonth()+1).padStart(2,'0');
      const da = String(dt.getDate()).padStart(2,'0');
      return `${y}-${m}-${da}`;
    };
    jobs.forEach((j) => {
      const raw = j.dateApplied || j.appliedDate || j.createdAt;
      if (raw) dates.add(format(raw));
    });
    if (dates.size === 0) return 0;
    const probe = new Date(); probe.setHours(0,0,0,0);
    let count = 0;
    while (true) {
      const key = format(probe);
      if (dates.has(key)) { count += 1; probe.setDate(probe.getDate()-1); }
      else break;
    }
    return count;
  }, [jobs]);

  return { loading, error, jobs, total, last7, last30, streak, rankFriends, rankGlobal, refresh: () => fetchAll(true) };
}
