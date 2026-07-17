import React, { useMemo, useState, useCallback } from 'react';
import {
  DndContext,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  useDroppable,
  useDraggable,
  pointerWithin,
  rectIntersection,
} from '@dnd-kit/core';
import { Building, Calendar, MapPin } from 'lucide-react';
import { trackEvent } from '../utils/analytics';

// ─── Column definitions ────────────────────────────────────────────────────
export const KANBAN_COLUMNS = [
  { id: 'Applied',             label: 'Applied',           dot: 'bg-blue-500',    col: 'border-blue-300/40 dark:border-blue-700/40',   header: 'text-blue-600 dark:text-blue-400',   count: 'bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300',   drop: 'bg-blue-500/8 border-blue-400' },
  { id: 'Online Assessment',   label: 'OA',                dot: 'bg-violet-500',  col: 'border-violet-300/40 dark:border-violet-700/40', header: 'text-violet-600 dark:text-violet-400', count: 'bg-violet-100 dark:bg-violet-900/60 text-violet-700 dark:text-violet-300', drop: 'bg-violet-500/8 border-violet-400' },
  { id: 'Phone Interview',     label: 'Phone Screen',      dot: 'bg-amber-500',   col: 'border-amber-300/40 dark:border-amber-700/40',   header: 'text-amber-600 dark:text-amber-400',   count: 'bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300',   drop: 'bg-amber-500/8 border-amber-400' },
  { id: 'Technical Interview', label: 'Technical',         dot: 'bg-orange-500',  col: 'border-orange-300/40 dark:border-orange-700/40', header: 'text-orange-600 dark:text-orange-400', count: 'bg-orange-100 dark:bg-orange-900/60 text-orange-700 dark:text-orange-300', drop: 'bg-orange-500/8 border-orange-400' },
  { id: 'Final Interview',     label: 'Final Interview',   dot: 'bg-rose-500',    col: 'border-rose-300/40 dark:border-rose-700/40',     header: 'text-rose-600 dark:text-rose-400',     count: 'bg-rose-100 dark:bg-rose-900/60 text-rose-700 dark:text-rose-300',     drop: 'bg-rose-500/8 border-rose-400' },
  { id: 'Accepted',            label: 'Accepted',          dot: 'bg-emerald-500', col: 'border-emerald-300/40 dark:border-emerald-700/40', header: 'text-emerald-600 dark:text-emerald-400', count: 'bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300', drop: 'bg-emerald-500/8 border-emerald-400' },
  { id: 'Rejected',            label: 'Rejected',          dot: 'bg-red-500',     col: 'border-red-300/40 dark:border-red-700/40',       header: 'text-red-600 dark:text-red-400',       count: 'bg-red-100 dark:bg-red-900/60 text-red-700 dark:text-red-300',       drop: 'bg-red-500/8 border-red-400' },
  { id: 'Waitlisted',          label: 'Waitlisted',        dot: 'bg-yellow-500',  col: 'border-yellow-300/40 dark:border-yellow-700/40', header: 'text-yellow-600 dark:text-yellow-400', count: 'bg-yellow-100 dark:bg-yellow-900/60 text-yellow-700 dark:text-yellow-300', drop: 'bg-yellow-500/8 border-yellow-400' },
  { id: 'Withdrawn',           label: 'Withdrawn',         dot: 'bg-gray-400',    col: 'border-gray-300/40 dark:border-gray-700/40',     header: 'text-gray-500 dark:text-gray-400',     count: 'bg-gray-100 dark:bg-gray-800/60 text-gray-600 dark:text-gray-400',     drop: 'bg-gray-500/8 border-gray-400' },
];

const COL_IDS = new Set(KANBAN_COLUMNS.map(c => c.id));

// ─── Custom collision: pointer-first, rect fallback, columns only ──────────
function columnOnlyCollision(args) {
  const colContainers = args.droppableContainers.filter(c => COL_IDS.has(c.id));
  const pointer = pointerWithin({ ...args, droppableContainers: colContainers });
  if (pointer.length > 0) return pointer;
  return rectIntersection({ ...args, droppableContainers: colContainers });
}

// ─── Job card ─────────────────────────────────────────────────────────────
function JobCard({ job, onEdit, onUpdateStatus }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: job._id });

  const style = transform
    ? { transform: `translate(${transform.x}px, ${transform.y}px)`, zIndex: 50 }
    : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      aria-label={`${job.role} at ${job.company}, status: ${job.status}. Drag or use the status selector to move.`}
      className={`
        rounded-lg border bg-white dark:bg-gray-800 p-3 select-none
        transition-shadow duration-100
        ${isDragging
          ? 'shadow-2xl cursor-grabbing ring-2 ring-primary/40'
          : 'shadow-sm hover:shadow-md cursor-grab border-border/60'
        }
      `}
    >
      <div className="flex items-start justify-between gap-1 mb-2">
        <p className="font-semibold text-[13px] leading-tight text-foreground line-clamp-2 flex-1">{job.role}</p>
        <button
          onPointerDown={e => e.stopPropagation()}
          onClick={e => { e.stopPropagation(); onEdit(job); }}
          aria-label={`Edit ${job.role} at ${job.company}`}
          className="shrink-0 text-[11px] text-muted-foreground hover:text-foreground border border-border/60 rounded px-1.5 py-0.5 hover:bg-muted/50 transition-colors"
        >
          Edit
        </button>
      </div>
      <div className="space-y-1">
        <div className="flex items-center gap-1.5 text-[12px] text-muted-foreground">
          <Building className="h-3 w-3 shrink-0" aria-hidden="true" />
          <span className="truncate">{job.company}</span>
        </div>
        {job.location && (
          <div className="flex items-center gap-1.5 text-[12px] text-muted-foreground">
            <MapPin className="h-3 w-3 shrink-0" aria-hidden="true" />
            <span className="truncate">{job.location}</span>
          </div>
        )}
        <div className="flex items-center gap-1.5 text-[12px] text-muted-foreground">
          <Calendar className="h-3 w-3 shrink-0" aria-hidden="true" />
          <span>{job.dateApplied ? new Date(job.dateApplied).toLocaleDateString(undefined, { timeZone: 'UTC', month: 'short', day: 'numeric' }) : '—'}</span>
        </div>
        {job.stipend && (
          <p className="text-[12px] font-medium text-emerald-600 dark:text-emerald-400 pt-0.5">{job.stipend}</p>
        )}
      </div>
      {/* Keyboard-accessible status selector — visually minimal, always available to keyboard/screen-reader users */}
      <div className="mt-2 pt-2 border-t border-border/40">
        <label htmlFor={`status-${job._id}`} className="sr-only">Move to status</label>
        <select
          id={`status-${job._id}`}
          value={job.status}
          onPointerDown={e => e.stopPropagation()}
          onChange={e => {
            const next = e.target.value;
            if (next !== job.status) {
              trackEvent('job_status_changed', { from: job.status, to: next, method: 'kanban_select' });
              onUpdateStatus(job._id, next);
            }
          }}
          className="w-full text-[11px] bg-transparent border border-border/40 rounded px-1.5 py-0.5 text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring cursor-pointer"
          aria-label={`Change status for ${job.role}`}
        >
          {KANBAN_COLUMNS.map(col => (
            <option key={col.id} value={col.id}>{col.label}</option>
          ))}
        </select>
      </div>
    </div>
  );
}

// ─── Column ────────────────────────────────────────────────────────────────
function KanbanColumn({ col, jobs, onEdit, onUpdateStatus, displayCount }) {
  const { setNodeRef, isOver } = useDroppable({ id: col.id });
  const count = displayCount ?? jobs.length;

  return (
    <div className="flex flex-col w-full min-w-0">
      <div className="flex items-center gap-2 mb-2 px-0.5">
        <span className={`w-2 h-2 rounded-full flex-shrink-0 ${col.dot}`} aria-hidden="true" />
        <span className={`text-[13px] font-semibold truncate ${col.header}`}>{col.label}</span>
        <span className={`ml-auto text-[11px] font-semibold px-1.5 py-0.5 rounded-full flex-shrink-0 ${col.count}`} aria-label={`${count} jobs`}>
          {count}
        </span>
      </div>

      <div
        ref={setNodeRef}
        role="group"
        aria-label={`${col.label} column — ${count} job${count !== 1 ? 's' : ''}`}
        className={`
          flex-1 rounded-xl border-2 border-dashed p-2 space-y-2 min-h-[200px] transition-colors duration-150
          ${isOver
            ? `${col.drop} border-opacity-100`
            : `${col.col} border-opacity-60`
          }
        `}
      >
        {jobs.map(job => (
          <JobCard key={job._id} job={job} onEdit={onEdit} onUpdateStatus={onUpdateStatus} />
        ))}
        {jobs.length === 0 && (
          <div className={`flex items-center justify-center h-16 text-[12px] rounded-lg transition-colors ${isOver ? 'text-foreground/60' : 'text-muted-foreground/30'}`} aria-hidden="true">
            {isOver ? '↓ Drop here' : 'Empty'}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main board ───────────────────────────────────────────────────────────
export default function KanbanBoard({ internships, searchTerm, onUpdateStatus, onEdit }) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor)
  );

  // Track which card is being dragged and which column it's hovering over
  const [dragState, setDragState] = useState({ activeId: null, sourceColId: null, overColId: null });

  const filtered = useMemo(() => {
    if (!searchTerm) return internships;
    const q = searchTerm.toLowerCase();
    return internships.filter(j =>
      j.company.toLowerCase().includes(q) ||
      j.role.toLowerCase().includes(q) ||
      (j.location || '').toLowerCase().includes(q)
    );
  }, [internships, searchTerm]);

  const byColumn = useMemo(() => {
    const map = {};
    KANBAN_COLUMNS.forEach(c => { map[c.id] = []; });
    filtered.forEach(job => {
      if (map[job.status]) map[job.status].push(job);
      else if (map['Applied']) map['Applied'].push(job);
    });
    return map;
  }, [filtered]);

  const clearDrag = useCallback(() => {
    setDragState({ activeId: null, sourceColId: null, overColId: null });
  }, []);

  // Compute an optimistic count delta for each column while dragging
  function getDisplayCount(colId) {
    const { sourceColId, overColId } = dragState;
    if (!sourceColId || !overColId || sourceColId === overColId) return null;
    const base = (byColumn[colId] || []).length;
    if (colId === sourceColId) return base - 1;
    if (colId === overColId) return base + 1;
    return null;
  }

  return (
    <div>
      <DndContext
        sensors={sensors}
        collisionDetection={columnOnlyCollision}
        onDragStart={({ active }) => {
          const job = internships.find(j => j._id === active.id);
          if (job) setDragState({ activeId: active.id, sourceColId: job.status, overColId: job.status });
        }}
        onDragOver={({ over }) => {
          if (!over || !COL_IDS.has(over.id)) return;
          setDragState(prev => ({ ...prev, overColId: over.id }));
        }}
        onDragEnd={({ active, over }) => {
          clearDrag();
          if (!over || !COL_IDS.has(over.id)) return;
          const job = internships.find(j => j._id === active.id);
          if (!job || job.status === over.id) return;
          trackEvent('job_status_changed', { from: job.status, to: over.id, method: 'kanban' });
          onUpdateStatus(active.id, over.id);
        }}
        onDragCancel={clearDrag}
      >
        <div role="region" aria-label="Kanban board — drag cards between columns or use the status selector on each card" className="grid gap-2 pb-4 pt-1" style={{ gridTemplateColumns: 'repeat(9, minmax(0, 1fr))' }}>
          {KANBAN_COLUMNS.map(col => (
            <KanbanColumn
              key={col.id}
              col={col}
              jobs={byColumn[col.id] || []}
              onEdit={onEdit}
              onUpdateStatus={onUpdateStatus}
              displayCount={getDisplayCount(col.id)}
            />
          ))}
        </div>
      </DndContext>

      {/* Column count summary */}
      <div className="flex gap-2 flex-wrap mt-3 px-4">
        {KANBAN_COLUMNS.map(col => (
          <span key={col.id} className="text-[11px] text-muted-foreground">
            <span className={`inline-block w-1.5 h-1.5 rounded-full ${col.dot} mr-1`} />
            {col.label}: <strong>{getDisplayCount(col.id) ?? (byColumn[col.id] || []).length}</strong>
          </span>
        ))}
      </div>
    </div>
  );
}
