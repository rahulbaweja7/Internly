/**
 * Pure dashboard-stat calculation, extracted from DashboardStats so it can be
 * unit-tested without rendering. This is the logic that once shipped an
 * always-0 "Interview" count (it summed a status key that never existed).
 *
 * @param {number} total - total number of applications
 * @param {Record<string, number>} statusCounts - count of jobs keyed by status
 * @returns {{ total:number, onlineAssessments:number, interview:number,
 *             accepted:number, rejected:number, responseRate:number }}
 */
export function computeStats(total, statusCounts = {}) {
  const count = (key) => statusCounts[key] || 0;

  // Phone/Technical/Final stay distinct everywhere else — only the overview
  // totals them under one "Interview" number.
  const interview =
    count('Phone Interview') + count('Technical Interview') + count('Final Interview');
  const onlineAssessments = count('Online Assessment');
  const accepted = count('Accepted');
  const rejected = count('Rejected');
  const responseRate =
    total > 0 ? Math.round(((onlineAssessments + accepted) / total) * 100) : 0;

  return { total, onlineAssessments, interview, accepted, rejected, responseRate };
}
