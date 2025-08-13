import React from 'react';
import { cn } from '../../lib/utils';

function getStyleForDays(days) {
  if (!days || days <= 0) {
    return {
      container:
        'bg-gray-100 text-gray-700 dark:bg-gray-800/60 dark:text-gray-300 ring-1 ring-gray-200/60',
      flame: 'opacity-70',
    };
  }
  if (days < 3) {
    return {
      container:
        'bg-gradient-to-r from-amber-50 to-orange-50 text-orange-700 ring-1 ring-amber-200/70',
      flame: 'drop-shadow-[0_0_6px_rgba(251,146,60,0.35)]',
    };
  }
  if (days < 7) {
    return {
      container:
        'bg-gradient-to-r from-orange-50 to-rose-50 text-orange-700 ring-1 ring-orange-200 shadow-sm',
      flame: 'drop-shadow-[0_0_8px_rgba(249,115,22,0.45)]',
    };
  }
  return {
    container:
      'bg-gradient-to-r from-emerald-50 to-green-50 text-emerald-700 ring-1 ring-emerald-200 shadow',
    flame: 'drop-shadow-[0_0_8px_rgba(16,185,129,0.35)]',
  };
}

export default function StreakBadge({ days = 0, className, onClick }) {
  const style = getStyleForDays(days);
  const label = days > 0 ? `${days}-day streak` : 'Start your streak';

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs md:text-sm font-semibold',
        'transition-all hover:shadow-md hover:-translate-y-[1px] focus:outline-none focus:ring-2 focus:ring-offset-2',
        style.container,
        className
      )}
      title={`Current streak: ${days} day${days === 1 ? '' : 's'}`}
    >
      <span className={cn('text-lg leading-none', days > 0 && 'animate-pulse', style.flame)}>🔥</span>
      <span>{label}</span>
    </button>
  );
}


