const { Queue } = require('bullmq');
const connection = require('./connection');

const gmailScanQueue = new Queue('gmail-scan', {
  connection,
  defaultJobOptions: {
    removeOnComplete: { age: 300 }, // results live 5 min in BullMQ job store
    removeOnFail: { count: 5 },
    attempts: 1, // no retry — user will re-scan manually if it fails
  },
});

module.exports = gmailScanQueue;
