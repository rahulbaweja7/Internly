const Job = require('../models/Job');

const statusRank = {
  'Applied': 1,
  'Online Assessment': 2,
  'Phone Interview': 3,
  'Technical Interview': 4,
  'Final Interview': 5,
  'Accepted': 6,
  'Rejected': 6,
};

const normalize = (v) => (v || '')
  .toString()
  .toLowerCase()
  .replace(/&/g, ' and ')
  .replace(/[^a-z0-9]+/g, ' ')
  .trim()
  .replace(/\s+/g, ' ');

async function upsertJobFromParsed(userId, parsed) {
  const { company, position, status, appliedDate, emailId, subject, location, stipend, notes, isLikelyNonApplication } = parsed;

  // Drop items flagged as non-application
  if (isLikelyNonApplication) {
    return { skipped: true, reason: 'non_application_signal' };
  }

  const normalizedCompany = normalize(company);
  const normalizedRole = normalize(position)
    .replace(/software\s+engineer/gi, 'swe')
    .replace(/full\s*stack/gi, 'fullstack')
    .replace(/internship/gi, 'intern')
    .trim();

  let job = await Job.findOne({ userId, normalizedCompany, normalizedRole });
  if (!job) {
    job = new Job({
      userId,
      company,
      role: position,
      location,
      status: status || 'Applied',
      stipend,
      dateApplied: appliedDate,
      notes,
      emailId,
      statusHistory: [
        { status: status || 'Applied', at: new Date(appliedDate || Date.now()), source: 'gmail', emailId, subject },
      ],
    });
    await job.save();
    return { job, created: true };
  }

  const currentRank = statusRank[job.status] || 0;
  const incomingRank = statusRank[status] || 0;
  let updated = false;
  if (incomingRank > currentRank) {
    job.status = status;
    updated = true;
  }
  if (location && !job.location) { job.location = location; updated = true; }
  if (stipend && !job.stipend) { job.stipend = stipend; updated = true; }
  if (appliedDate && (!job.dateApplied || new Date(appliedDate) < job.dateApplied)) {
    job.dateApplied = appliedDate; // keep earliest application date
    updated = true;
  }
  if (notes) { job.notes = job.notes ? `${job.notes}\n${notes}` : notes; updated = true; }

  const hasEmailInHistory = emailId && (job.emailId === emailId || (job.statusHistory || []).some(h => h.emailId === emailId));
  if (emailId && !hasEmailInHistory) {
    if (!job.emailId) { job.emailId = emailId; updated = true; }
    const willChangeStatus = (incomingRank > currentRank) || (status && status !== job.status);
    if (willChangeStatus) {
      job.statusHistory.push({ status: status || job.status, at: new Date(), source: 'gmail', emailId, subject });
      updated = true;
    }
  } else if (incomingRank > currentRank) {
    // Record status change without duplicating emailId
    job.statusHistory.push({ status: status, at: new Date(), source: 'gmail', subject });
    updated = true;
  }

  if (updated) await job.save();
  return { job, created: false, updated };
}

module.exports = { upsertJobFromParsed, statusRank };


