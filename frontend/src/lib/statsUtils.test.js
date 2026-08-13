import { computeStats } from './statsUtils';

describe('computeStats', () => {
  it('sums Phone/Technical/Final into a single interview count', () => {
    const s = computeStats(10, {
      'Phone Interview': 2,
      'Technical Interview': 3,
      'Final Interview': 1,
    });
    expect(s.interview).toBe(6);
  });

  it('does NOT read a bare "Interview" status (the bug that shipped)', () => {
    // There is no status literally named "Interview" — it must never count.
    const s = computeStats(5, { Interview: 99, 'Phone Interview': 1 });
    expect(s.interview).toBe(1);
  });

  it('passes through the individual counts', () => {
    const s = computeStats(4, {
      'Online Assessment': 2,
      Accepted: 1,
      Rejected: 1,
    });
    expect(s.total).toBe(4);
    expect(s.onlineAssessments).toBe(2);
    expect(s.accepted).toBe(1);
    expect(s.rejected).toBe(1);
  });

  it('computes response rate as round((OA + Accepted) / total * 100)', () => {
    // (2 + 1) / 4 = 75%
    expect(computeStats(4, { 'Online Assessment': 2, Accepted: 1 }).responseRate).toBe(75);
    // rounding: (1 + 0) / 3 = 33.33 -> 33
    expect(computeStats(3, { 'Online Assessment': 1 }).responseRate).toBe(33);
  });

  it('returns zeros for empty input without dividing by zero', () => {
    const s = computeStats(0, {});
    expect(s).toEqual({
      total: 0,
      onlineAssessments: 0,
      interview: 0,
      accepted: 0,
      rejected: 0,
      responseRate: 0,
    });
  });

  it('defaults missing statusCounts to an empty object', () => {
    expect(() => computeStats(0)).not.toThrow();
    expect(computeStats(0).interview).toBe(0);
  });
});
