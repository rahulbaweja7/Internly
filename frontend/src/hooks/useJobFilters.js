import { useMemo } from 'react';

export const PAGE_SIZE = 50;

const toDayKey = (v) => {
  const d = new Date(v || 0);
  if (isNaN(d)) return '';
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`;
};

/**
 * Filters, sorts, and paginates the jobs list.
 *
 * @param {{ internships: Array, searchTerm: string, statusFilter: string, page: number }} opts
 */
export function useJobFilters({ internships, searchTerm, statusFilter, page }) {
  const filteredInternships = useMemo(() => {
    const q = searchTerm.toLowerCase();
    return internships
      .filter((job) => {
        const matchesSearch =
          !q ||
          job.company.toLowerCase().includes(q) ||
          job.role.toLowerCase().includes(q) ||
          job.location.toLowerCase().includes(q) ||
          (job.notes && job.notes.toLowerCase().includes(q)) ||
          (job.stipend && job.stipend.toLowerCase().includes(q));
        const matchesStatus = statusFilter === 'all' || job.status === statusFilter;
        return matchesSearch && matchesStatus;
      })
      .sort((a, b) => {
        const dayA = toDayKey(a.dateApplied || a.appliedDate || a.createdAt);
        const dayB = toDayKey(b.dateApplied || b.appliedDate || b.createdAt);
        if (dayA !== dayB) return dayB.localeCompare(dayA);
        const createdDiff = new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
        if (createdDiff !== 0) return createdDiff;
        return new Date(b.dateApplied || b.appliedDate || 0) - new Date(a.dateApplied || a.appliedDate || 0);
      });
  }, [internships, searchTerm, statusFilter]);

  const statusCounts = useMemo(
    () =>
      internships.reduce((acc, job) => {
        acc[job.status] = (acc[job.status] || 0) + 1;
        return acc;
      }, {}),
    [internships]
  );

  const totalPages = Math.max(1, Math.ceil(filteredInternships.length / PAGE_SIZE));
  const start = (page - 1) * PAGE_SIZE;
  const pageItems = filteredInternships.slice(start, start + PAGE_SIZE);

  return { filteredInternships, pageItems, totalPages, start, statusCounts };
}
