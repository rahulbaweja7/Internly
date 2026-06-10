require('dotenv').config();
const mongoose = require('mongoose');
const app = require('./app');
const reminderQueue = require('./queues/reminderQueue');
const { startReminderWorker } = require('./workers/reminderWorker');

const PORT = process.env.PORT || 3001;
const REMINDER_INTERVAL_MS = 24 * 60 * 60 * 1000; // 24 hours

mongoose
  .connect(process.env.MONGO_URI)
  .then(async () => {
    console.log('MongoDB connected');
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

    if (process.env.NODE_ENV !== 'test') {
      // Start the worker that processes reminder jobs
      startReminderWorker();

      // Register the daily repeatable job — BullMQ deduplicates by name+repeat key,
      // so calling this on every restart is safe and won't create duplicates
      await reminderQueue.add(
        'daily-reminder',
        {},
        { repeat: { every: REMINDER_INTERVAL_MS } }
      );
      console.log('[reminderQueue] Daily reminder job scheduled');
    }
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });