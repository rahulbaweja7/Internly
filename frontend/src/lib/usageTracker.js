// Lightweight client-side usage tracking stored in localStorage
// Tracks: total active time (ms) and number of app openings (uses)

const STORAGE_KEY = 'applycation_usage_v1';

function readStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw) || {};
  } catch (_) {
    return {};
  }
}

function writeStorage(data) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (_) {
    // ignore
  }
}

export function startUsageTracking() {
  if (typeof window === 'undefined') return;
  const now = Date.now();
  const data = readStorage();

  // Increment uses once per new page load
  data.uses = (data.uses || 0) + 1;
  data.lastActiveAt = now;
  data.totalMs = data.totalMs || 0;
  writeStorage(data);

  const onVisibility = () => {
    const d = readStorage();
    const t = Date.now();
    if (document.visibilityState === 'hidden') {
      // add elapsed since lastActiveAt
      if (d.lastActiveAt) {
        d.totalMs = (d.totalMs || 0) + Math.max(0, t - d.lastActiveAt);
        d.lastActiveAt = null;
        writeStorage(d);
      }
    } else if (document.visibilityState === 'visible') {
      d.lastActiveAt = t;
      writeStorage(d);
    }
  };

  const onBeforeUnload = () => {
    const d = readStorage();
    const t = Date.now();
    if (d.lastActiveAt) {
      d.totalMs = (d.totalMs || 0) + Math.max(0, t - d.lastActiveAt);
      d.lastActiveAt = t; // reset so future restores resume from new time
      writeStorage(d);
    }
  };

  document.addEventListener('visibilitychange', onVisibility);
  window.addEventListener('pagehide', onBeforeUnload);
  window.addEventListener('beforeunload', onBeforeUnload);
}

export function getUsageMetrics() {
  const d = readStorage();
  let totalMs = d.totalMs || 0;
  if (d.lastActiveAt && document.visibilityState !== 'hidden') {
    totalMs += Math.max(0, Date.now() - d.lastActiveAt);
  }
  return { uses: d.uses || 0, totalMs };
}

export function formatDuration(ms) {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  if (hours > 0) return `${hours}h ${minutes}m ${seconds}s`;
  if (minutes > 0) return `${minutes}m ${seconds}s`;
  return `${seconds}s`;
}


