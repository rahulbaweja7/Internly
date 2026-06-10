const { Queue } = require('bullmq');
const connection = require('./connection');

const reminderQueue = new Queue('reminders', {
  connection,
  defaultJobOptions: {
    removeOnComplete: { count: 3 },
    removeOnFail: { count: 10 },
    attempts: 3,
    backoff: { type: 'exponential', delay: 5000 },
  },
});

module.exports = reminderQueue;
