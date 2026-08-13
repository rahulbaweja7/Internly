import { renderHook } from '@testing-library/react';
import { useJobFilters, PAGE_SIZE } from './useJobFilters';

const makeJob = (over = {}) => ({
  _id: Math.random().toString(36).slice(2),
  company: 'Acme',
  role: 'Engineer',
  location: 'Remote',
  status: 'Applied',
  notes: '',
  stipend: '',
  dateApplied: '2024-01-01',
  createdAt: '2024-01-01T00:00:00.000Z',
  ...over,
});

const run = (internships, opts = {}) =>
  renderHook(() =>
    useJobFilters({ internships, searchTerm: '', statusFilter: 'all', page: 1, ...opts })
  ).result.current;

describe('useJobFilters', () => {
  it('returns all jobs when no search or status filter', () => {
    const jobs = [makeJob(), makeJob(), makeJob()];
    const { filteredInternships } = run(jobs);
    expect(filteredInternships).toHaveLength(3);
  });

  it('filters by search across company/role/location', () => {
    const jobs = [
      makeJob({ company: 'Google' }),
      makeJob({ role: 'Data Scientist' }),
      makeJob({ location: 'Berlin' }),
    ];
    expect(run(jobs, { searchTerm: 'google' }).filteredInternships).toHaveLength(1);
    expect(run(jobs, { searchTerm: 'scientist' }).filteredInternships).toHaveLength(1);
    expect(run(jobs, { searchTerm: 'berlin' }).filteredInternships).toHaveLength(1);
    expect(run(jobs, { searchTerm: 'nomatch' }).filteredInternships).toHaveLength(0);
  });

  it('matches against optional notes and stipend fields', () => {
    const jobs = [
      makeJob({ notes: 'referred by a friend' }),
      makeJob({ stipend: '$8000/mo' }),
    ];
    expect(run(jobs, { searchTerm: 'referred' }).filteredInternships).toHaveLength(1);
    expect(run(jobs, { searchTerm: '8000' }).filteredInternships).toHaveLength(1);
  });

  it('filters by exact status when statusFilter is set', () => {
    const jobs = [
      makeJob({ status: 'Applied' }),
      makeJob({ status: 'Rejected' }),
      makeJob({ status: 'Rejected' }),
    ];
    expect(run(jobs, { statusFilter: 'Rejected' }).filteredInternships).toHaveLength(2);
  });

  it('sorts most-recently-applied first', () => {
    const jobs = [
      makeJob({ company: 'Old', dateApplied: '2023-01-01' }),
      makeJob({ company: 'New', dateApplied: '2024-06-01' }),
      makeJob({ company: 'Mid', dateApplied: '2023-09-01' }),
    ];
    const order = run(jobs).filteredInternships.map((j) => j.company);
    expect(order).toEqual(['New', 'Mid', 'Old']);
  });

  it('computes statusCounts by status', () => {
    const jobs = [
      makeJob({ status: 'Applied' }),
      makeJob({ status: 'Applied' }),
      makeJob({ status: 'Accepted' }),
    ];
    const { statusCounts } = run(jobs);
    expect(statusCounts.Applied).toBe(2);
    expect(statusCounts.Accepted).toBe(1);
  });

  it('paginates by PAGE_SIZE', () => {
    const jobs = Array.from({ length: PAGE_SIZE + 10 }, (_, i) =>
      makeJob({ dateApplied: `2024-01-${String((i % 28) + 1).padStart(2, '0')}` })
    );
    const p1 = run(jobs, { page: 1 });
    expect(p1.pageItems).toHaveLength(PAGE_SIZE);
    expect(p1.totalPages).toBe(2);
    expect(p1.start).toBe(0);

    const p2 = run(jobs, { page: 2 });
    expect(p2.pageItems).toHaveLength(10);
    expect(p2.start).toBe(PAGE_SIZE);
  });
});
