import { JOB_STATUSES, STATUS_META, STATUS_BADGE_CLASS } from './jobStatuses';

// Regression guard: a status silently missing from one of these maps is
// exactly the class of bug that shipped this session (a stat/badge quietly
// falling through to a default). If a status is ever added to JOB_STATUSES
// without a matching map entry, these fail loudly instead.
describe('jobStatuses maps stay in sync with JOB_STATUSES', () => {
  it('has at least the known statuses', () => {
    expect(JOB_STATUSES.length).toBeGreaterThan(0);
    expect(JOB_STATUSES).toContain('Applied');
  });

  it('every status has a STATUS_META entry with color + label', () => {
    JOB_STATUSES.forEach((status) => {
      expect(STATUS_META[status]).toBeDefined();
      expect(STATUS_META[status]).toHaveProperty('color');
      expect(STATUS_META[status]).toHaveProperty('label');
    });
  });

  it('every status has a STATUS_BADGE_CLASS entry', () => {
    JOB_STATUSES.forEach((status) => {
      expect(typeof STATUS_BADGE_CLASS[status]).toBe('string');
      expect(STATUS_BADGE_CLASS[status].length).toBeGreaterThan(0);
    });
  });

  it('has no stray map keys that are not real statuses', () => {
    Object.keys(STATUS_META).forEach((key) => expect(JOB_STATUSES).toContain(key));
    Object.keys(STATUS_BADGE_CLASS).forEach((key) => expect(JOB_STATUSES).toContain(key));
  });
});
