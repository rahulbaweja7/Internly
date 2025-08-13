import React from 'react';
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
  const countByDate = new Map();
  let maxCount = 0;
  (internships || []).forEach((app) => {
    if (!app?.dateApplied && !app?.appliedDate) return;
    const dateObj = new Date(app.dateApplied || app.appliedDate);
    if (isNaN(dateObj)) return;
    const key = formatYmd(dateObj);
    const next = (countByDate.get(key) || 0) + 1;
    countByDate.set(key, next);
    if (next > maxCount) maxCount = next;
  });

  // Build 52 weeks of data ending today, start aligned to Sunday like GitHub
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const start = new Date(today);
  start.setDate(start.getDate() - 365);
  // shift start back to previous Sunday
  start.setDate(start.getDate() - start.getDay());

  const weeks = [];
  let cursor = new Date(start);
  while (cursor <= today) {
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
    weeks.push(week);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Applications Heatmap</CardTitle>
        <CardDescription>Daily count of applications over the past year</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <div className="flex gap-1">
            {weeks.map((week, wIdx) => (
              <div key={wIdx} className="flex flex-col gap-1">
                {week.map((day, dIdx) => (
                  <div
                    key={`${wIdx}-${dIdx}`}
                    className={`h-3 w-3 md:h-3.5 md:w-3.5 rounded-sm ${getColorClass(day.count, maxCount)}`}
                    title={`${day.date.toLocaleDateString()}: ${day.count} application${day.count === 1 ? '' : 's'}`}
                  />
                ))}
              </div>
            ))}
          </div>
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


