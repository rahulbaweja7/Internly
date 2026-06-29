// Canonical job application statuses — must stay in sync with backend/schemas/job.js VALID_STATUSES
export const JOB_STATUSES = [
  'Applied',
  'Online Assessment',
  'Phone Interview',
  'Technical Interview',
  'Final Interview',
  'Accepted',
  'Rejected',
  'Waitlisted',
  'Withdrawn',
];

// Status metadata for consistent styling across Kanban, badges, and forms
export const STATUS_META = {
  'Applied':             { color: 'blue',    label: 'Applied' },
  'Online Assessment':   { color: 'violet',  label: 'OA' },
  'Phone Interview':     { color: 'amber',   label: 'Phone Screen' },
  'Technical Interview': { color: 'orange',  label: 'Technical' },
  'Final Interview':     { color: 'rose',    label: 'Final Interview' },
  'Accepted':            { color: 'emerald', label: 'Accepted' },
  'Rejected':            { color: 'red',     label: 'Rejected' },
  'Waitlisted':          { color: 'yellow',  label: 'Waitlisted' },
  'Withdrawn':           { color: 'gray',    label: 'Withdrawn' },
};

// Badge Tailwind classes indexed by status
export const STATUS_BADGE_CLASS = {
  'Applied':             'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  'Online Assessment':   'bg-violet-100 text-violet-800 dark:bg-violet-900/30 dark:text-violet-400',
  'Phone Interview':     'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
  'Technical Interview': 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
  'Final Interview':     'bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-400',
  'Accepted':            'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400',
  'Rejected':            'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  'Waitlisted':          'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  'Withdrawn':           'bg-gray-100 text-gray-700 dark:bg-gray-800/60 dark:text-gray-400',
};
