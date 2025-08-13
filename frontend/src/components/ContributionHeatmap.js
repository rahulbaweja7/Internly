import React, { useMemo, useRef, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';

function formatYmd(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getColorClass(count, maxCount) {
  if (!count) return 'bg-gray-200 dark:bg-gray-700';
  // 4 buckets relative to max, fallback thresholds
  const thresholds = maxCount > 0
    ? [1, Math.ceil(maxCount * 0.33), Math.ceil(maxCount * 0.66), maxCount]
    : [1, 2, 4, 6];

  if (count <= thresholds[0]) return 'bg-green-100 dark:bg-green-900';
  if (count <= thresholds[1]) return 'bg-green-300 dark:bg-green-800';
  if (count <= thresholds[2]) return 'bg-green-500 dark:bg-green-700';
  return 'bg-green-700 dark:bg-green-600';
}

export default function ContributionHeatmap({ internships }) {
  // Count applications per local date (YYYY-MM-DD)
  const { countByDate, maxCount } = useMemo(() => {
    const map = new Map();
    let max = 0;
    (internships || []).forEach((app) => {
      if (!app?.dateApplied && !app?.appliedDate) return;
      const dateObj = new Date(app.dateApplied || app.appliedDate);
      if (isNaN(dateObj)) return;
      const key = formatYmd(dateObj);
      const next = (map.get(key) || 0) + 1;
      map.set(key, next);
      if (next > max) max = next;
    });
    return { countByDate: map, maxCount: max };
  }, [internships]);

  // Build up to 53 weeks of data ending today, start aligned to Sunday like GitHub
  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const start = useMemo(() => {
    const s = new Date(today);
    s.setDate(s.getDate() - 7 * 53);
    s.setDate(s.getDate() - s.getDay());
    return s;
  }, [today]);

  const weeks = useMemo(() => {
    const out = [];
    let cursor = new Date(start);
    for (let w = 0; w < 53; w += 1) {
      const week = [];
      for (let i = 0; i < 7; i += 1) {
        const dateStr = formatYmd(cursor);
        week.push({
          date: new Date(cursor),
          dateStr,
          count: countByDate.get(dateStr) || 0,
        });
        cursor.setDate(cursor.getDate() + 1);
      }
      out.push(week);
    }
    return out;
  }, [start, countByDate]);

  // Month labels for the top (label a week when it begins a new month)
  const monthLabels = [];
  let lastMonth = -1;
  weeks.forEach((week, idx) => {
    const month = week[0].date.getMonth();
    if (month !== lastMonth) {
      monthLabels.push(week[0].date.toLocaleString(undefined, { month: 'short' }));
      lastMonth = month;
    } else {
      // reduce density of empty labels to keep spacing consistent across 53 columns
      monthLabels.push(idx % 2 === 0 ? '' : '');
    }
  });

  const isToday = (d) => formatYmd(d) === formatYmd(today);

  // Tooltip state
  const containerRef = useRef(null);
  const [tooltip, setTooltip] = useState({ visible: false, x: 0, y: 0, text: '' });

  const showTooltip = (event, day) => {
    const rect = containerRef.current?.getBoundingClientRect();
    const x = event.clientX - (rect?.left || 0) + 10;
    const y = event.clientY - (rect?.top || 0) + 10;
    const dateLabel = day.date.toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' });
    const countLabel = `${day.count} application${day.count === 1 ? '' : 's'}`;
    setTooltip({
      visible: true,
      x,
      y,
      text: `${countLabel} on ${dateLabel}`,
    });
  };

  const moveTooltip = (event) => {
    const rect = containerRef.current?.getBoundingClientRect();
    const x = event.clientX - (rect?.left || 0) + 10;
    const y = event.clientY - (rect?.top || 0) + 10;
    setTooltip((prev) => ({ ...prev, x, y }));
  };

  const hideTooltip = () => setTooltip({ visible: false, x: 0, y: 0, text: '' });

  // Flatten days to compute streaks (ignore future days)
  const flatDays = useMemo(() => {
    const list = [];
    weeks.forEach((week) => week.forEach((d) => { if (d.date <= today) list.push(d); }));
    return list;
  }, [weeks, today]);

  const currentStreak = useMemo(() => {
    let count = 0;
    for (let i = flatDays.length - 1; i >= 0; i -= 1) {
      const day = flatDays[i];
      if (day.count > 0) {
        count += 1;
      } else {
        break;
      }
    }
    return count;
  }, [flatDays]);

  // eslint-disable-next-line no-unused-vars
  const activeDaysTotal = useMemo(() => flatDays.reduce((acc, d) => acc + (d.count > 0 ? 1 : 0), 0), [flatDays]);

  return (
    <Card>
      <CardHeader className="flex items-start justify-between">
        <div>
          <CardTitle className="text-lg">Applications Heatmap</CardTitle>
          <CardDescription>Daily count of applications over the past year</CardDescription>
        </div>
        <div className="flex items-center gap-2">
          <div className="rounded-full bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-200 px-3 py-1 text-xs font-medium whitespace-nowrap">
            🔥 {currentStreak}-day streak
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          {/* Month labels */}
          <div className="ml-6 flex text-[10px] md:text-xs text-gray-500 dark:text-gray-400 select-none">
            {monthLabels.map((label, idx) => (
              <div key={`m-${idx}`} className="w-[14px] md:w-[16px] first:ml-0 ml-[3px]">
                {label && <span>{label}</span>}
              </div>
            ))}
          </div>

          <div className="flex">
            {/* Weekday labels */}
            <div className="mr-2 flex flex-col justify-between text-[10px] md:text-xs text-gray-500 dark:text-gray-400 select-none">
              <span className="h-3.5 md:h-4">Mon</span>
              <span className="h-3.5 md:h-4">Wed</span>
              <span className="h-3.5 md:h-4">Fri</span>
            </div>
            {/* Grid */}
            <div className="relative flex gap-1" ref={containerRef} onMouseLeave={hideTooltip}>
              {weeks.map((week, wIdx) => (
                <div key={wIdx} className="flex flex-col gap-1">
                  {week.map((day, dIdx) => (
                    <div
                      key={`${wIdx}-${dIdx}`}
                      className={`h-3.5 w-3.5 md:h-4 md:w-4 rounded-[3px] transition-transform duration-100 hover:scale-110 ${getColorClass(day.count, maxCount)} ${isToday(day.date) ? 'ring-1 ring-offset-1 ring-gray-400 dark:ring-gray-500' : ''}`}
                      onMouseEnter={(e) => showTooltip(e, day)}
                      onMouseMove={moveTooltip}
                      onMouseLeave={hideTooltip}
                    />
                  ))}
                </div>
              ))}

              {tooltip.visible && (
                <div
                  className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-full rounded-md bg-gray-900 text-white text-[11px] px-2 py-1 shadow-lg dark:bg-gray-800 whitespace-nowrap"
                  style={{ left: tooltip.x, top: tooltip.y }}
                  role="tooltip"
                >
                  {tooltip.text}
                </div>
              )}
            </div>
          </div>

          {/* Legend */}
          <div className="flex items-center gap-2 mt-3 text-xs text-gray-500 dark:text-gray-400">
            <span>Less</span>
            <div className="h-3 w-3 rounded-sm bg-gray-200 dark:bg-gray-700" />
            <div className="h-3 w-3 rounded-sm bg-green-100 dark:bg-green-900" />
            <div className="h-3 w-3 rounded-sm bg-green-300 dark:bg-green-800" />
            <div className="h-3 w-3 rounded-sm bg-green-500 dark:bg-green-700" />
            <div className="h-3 w-3 rounded-sm bg-green-700 dark:bg-green-600" />
            <span>More</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}


