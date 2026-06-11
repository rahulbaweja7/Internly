require('dotenv').config();
const mongoose = require('mongoose');
const app = require('./app');

const PORT = process.env.PORT || 3001;
const REMINDER_INTERVAL_MS = 24 * 60 * 60 * 1000;

async function startReminders() {
  if (process.env.NODE_ENV === 'test') return;

  if (process.env.REDIS_URL) {
    // Redis available — use BullMQ queue + worker
    try {
      const reminderQueue = require('./queues/reminderQueue');
      const { startReminderWorker } = require('./workers/reminderWorker');
      startReminderWorker();
      await reminderQueue.add('daily-reminder', {}, { repeat: { every: REMINDER_INTERVAL_MS } });
      console.log('[reminders] BullMQ worker + repeatable job registered');
    } catch (err) {
      console.error('[reminders] BullMQ setup failed, falling back to setTimeout:', err.message);
      startFallbackSchedule();
    }
  } else {
    // No Redis — fall back to in-process scheduler
    console.log('[reminders] No REDIS_URL, using in-process setTimeout scheduler');
    startFallbackSchedule();
  }
}

function startFallbackSchedule() {
  const { runReminders } = require('./utils/reminderService');
  setTimeout(() => {
    runReminders();
    setInterval(runReminders, REMINDER_INTERVAL_MS);
  }, 60 * 60 * 1000);
}

mongoose
  .connect(process.env.MONGO_URI)
  .then(async () => {
    console.log('MongoDB connected');
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
    await startReminders();
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });