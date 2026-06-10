const nodemailer = require('nodemailer');

const STALE_DAYS = 14;
const MS_PER_DAY = 86400000;

const createTransporter = () => nodemailer.createTransport({
  service: 'gmail',
  auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
});

const sendReminderEmail = async (user, staleJobs) => {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) return;
  const transporter = createTransporter();
  const jobList = staleJobs
    .slice(0, 5)
    .map(j => `<li><strong>${j.company}</strong> — ${j.role} (Applied ${new Date(j.dateApplied).toLocaleDateString()})</li>`)
    .join('');
  const more = staleJobs.length > 5 ? `<p>…and ${staleJobs.length - 5} more.</p>` : '';
  await transporter.sendMail({
    from: `Internly <${process.env.EMAIL_USER}>`,
    to: user.email,
    subject: `${staleJobs.length} application${staleJobs.length !== 1 ? 's' : ''} haven't had updates in ${STALE_DAYS}+ days`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
        <h2 style="color:#3b82f6">Follow-up reminder</h2>
        <p>Hi ${user.name || 'there'},</p>
        <p>These applications haven't had a status update in ${STALE_DAYS}+ days — it might be worth following up:</p>
        <ul>${jobList}</ul>
        ${more}
        <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard"
           style="display:inline-block;background:#3b82f6;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none;margin-top:16px">
          Open Internly
        </a>
        <p style="color:#9ca3af;font-size:12px;margin-top:24px">
          You're receiving this because you have an Internly account.
        </p>
      </div>`,
  });
};

const runReminders = async () => {
  if (process.env.NODE_ENV === 'test') return;
  const Job = require('../models/Job');
  const User = require('../models/User');
  const cutoff = new Date(Date.now() - STALE_DAYS * MS_PER_DAY);
  const activeStatuses = ['Applied', 'Online Assessment', 'Phone Interview', 'Technical Interview', 'Final Interview'];

  const staleJobs = await Job.find({
    status: { $in: activeStatuses },
    updatedAt: { $lt: cutoff },
  }).lean();

  if (staleJobs.length === 0) return;

  const byUser = staleJobs.reduce((acc, job) => {
    const uid = String(job.userId);
    if (!acc[uid]) acc[uid] = [];
    acc[uid].push(job);
    return acc;
  }, {});

  for (const [userId, jobs] of Object.entries(byUser)) {
    const user = await User.findById(userId).lean();
    if (!user || !user.email || !user.isEmailVerified) continue;
    await sendReminderEmail(user, jobs);
  }
};

module.exports = { runReminders };
