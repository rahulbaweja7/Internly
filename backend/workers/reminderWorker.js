const { Worker } = require('bullmq');
const connection = require('../queues/connection');
const { runReminders } = require('../utils/reminderService');

let worker;

function startReminderWorker() {
  if (process.env.NODE_ENV === 'test') return;

  worker = new Worker(
    'reminders',
    async (job) => {
      console.log(`[reminderWorker] Starting job ${job.id} (${job.name})`);
      await runReminders();
      console.log(`[reminderWorker] Finished job ${job.id}`);
    },
    {
      connection,
      concurrency: 1, // only one reminder batch at a time
    }
  );

  worker.on('failed', (job, err) => {
    console.error(`[reminderWorker] Job ${job?.id} failed: ${err.message}`);
  });

  return worker;
}

module.exports = { startReminderWorker };
