const { Worker } = require('bullmq');
const connection = require('../queues/connection');
const { runReminders } = require('../utils/reminderService');
const logger = require('../utils/logger').child({ module: 'reminderWorker' });

let worker;

function startReminderWorker() {
  if (process.env.NODE_ENV === 'test') return;

  worker = new Worker(
    'reminders',
    async (job) => {
      logger.info({ jobId: job.id, jobName: job.name }, 'Reminder job started');
      await runReminders();
      logger.info({ jobId: job.id }, 'Reminder job finished');
    },
    {
      connection,
      concurrency: 1, // only one reminder batch at a time
    }
  );

  worker.on('failed', (job, err) => {
    logger.error({ err, jobId: job?.id }, 'Reminder job failed');
  });

  return worker;
}

module.exports = { startReminderWorker };
