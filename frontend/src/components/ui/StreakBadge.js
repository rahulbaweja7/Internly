import React from 'react';
import { Flame } from 'lucide-react';
import { cn } from '../../lib/utils';

export default function StreakBadge({ days = 0, className, variant = 'default' }) {
  const labelText = days > 0 ? 'day streak' : 'Start your streak';

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full font-medium select-none',
        variant === 'compact'
          ? 'gap-1.5 px-3 py-1 text-[11px] bg-black text-white dark:bg-white dark:text-black'
          : 'gap-2 px-3.5 py-1.5 text-xs md:text-sm bg-black text-white dark:bg-white dark:text-black',
        className
      )}
      title={`Current streak: ${days} day${days === 1 ? '' : 's'}`}
      role="status"
      aria-live="polite"
    >
      <span className="animate-flame-wiggle">
        <Flame className={cn(variant === 'compact' ? 'h-3.5 w-3.5' : 'h-4 w-4')} />
      </span>
      {variant === 'compact' ? (
        <span className="flex items-baseline gap-0.5">
          <span className="font-semibold tabular-nums leading-none">
            {Math.max(0, Number(days) || 0)}
          </span>
          <span className="opacity-90 leading-none">d</span>
        </span>
      ) : (
        <span className="flex items-baseline gap-1">
          <span className="text-[0.95rem] font-semibold tabular-nums leading-none">
            {Math.max(0, Number(days) || 0)}
          </span>
          <span className="opacity-95 leading-none">{labelText}</span>
        </span>
      )}
    </span>
  );
}


