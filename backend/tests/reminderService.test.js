jest.mock('nodemailer');

const nodemailer = require('nodemailer');
const Job = require('../models/Job');
const User = require('../models/User');
const { runReminders } = require('../utils/reminderService');

const DAY = 86400000;

// Create a job, then force its updatedAt via the raw driver so mongoose's
// timestamps: true doesn't stamp it back to "now".
async function makeJob(userId, { status = 'Applied', ageDays = 20 } = {}) {
  const job = await Job.create({
    userId,
    company: 'Acme',
    role: 'SWE Intern',
    status,
    dateApplied: new Date(Date.now() - ageDays * DAY),
  });
  await Job.collection.updateOne(
    { _id: job._id },
    { $set: { updatedAt: new Date(Date.now() - ageDays * DAY) } }
  );
  return job;
}

// runReminders() no-ops when NODE_ENV === 'test'; flip it just for the call.
async function run() {
  const prev = process.env.NODE_ENV;
  process.env.NODE_ENV = 'development';
  try {
    await runReminders();
  } finally {
    process.env.NODE_ENV = prev;
  }
}

describe('runReminders', () => {
  let sendMail;
  const prevEnv = { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS };

  beforeEach(() => {
    sendMail = jest.fn().mockResolvedValue({});
    nodemailer.createTransport.mockReturnValue({ sendMail });
    process.env.EMAIL_USER = 'reminders@example.com';
    process.env.EMAIL_PASS = 'secret';
  });

  afterAll(() => {
    process.env.EMAIL_USER = prevEnv.user;
    process.env.EMAIL_PASS = prevEnv.pass;
  });

  it('emails a verified user about their stale active-status job', async () => {
    const user = await User.create({ name: 'A', email: 'a@example.com', password: 'secret1', isEmailVerified: true });
    await makeJob(user._id, { status: 'Applied', ageDays: 20 });

    await run();

    expect(sendMail).toHaveBeenCalledTimes(1);
    expect(sendMail.mock.calls[0][0].to).toBe('a@example.com');
  });

  it('does not email about jobs updated within the last 14 days', async () => {
    const user = await User.create({ name: 'B', email: 'b@example.com', password: 'secret1', isEmailVerified: true });
    await makeJob(user._id, { status: 'Applied', ageDays: 3 });

    await run();

    expect(sendMail).not.toHaveBeenCalled();
  });

  it('does not email about jobs in a final status', async () => {
    const user = await User.create({ name: 'C', email: 'c@example.com', password: 'secret1', isEmailVerified: true });
    await makeJob(user._id, { status: 'Rejected', ageDays: 20 });
    await makeJob(user._id, { status: 'Accepted', ageDays: 20 });

    await run();

    expect(sendMail).not.toHaveBeenCalled();
  });

  it('does not email users whose email is unverified', async () => {
    const user = await User.create({ name: 'D', email: 'd@example.com', password: 'secret1', isEmailVerified: false });
    await makeJob(user._id, { status: 'Applied', ageDays: 20 });

    await run();

    expect(sendMail).not.toHaveBeenCalled();
  });

  it('sends one email per user, batching all of that user\'s stale jobs', async () => {
    const user = await User.create({ name: 'E', email: 'e@example.com', password: 'secret1', isEmailVerified: true });
    await makeJob(user._id, { status: 'Applied', ageDays: 20 });
    await makeJob(user._id, { status: 'Phone Interview', ageDays: 30 });

    await run();

    expect(sendMail).toHaveBeenCalledTimes(1);
  });
});
