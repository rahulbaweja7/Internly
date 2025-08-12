require('dotenv').config();
const IORedis = require('ioredis');
const { Worker, Queue, QueueScheduler } = require('bullmq');
const mongoose = require('mongoose');
const { fetchNewJobApplicationEmails } = require('./gmailAuth');
const { parseJobEmail } = require('./utils/jobEmailParser');
const { upsertJobFromParsed } = require('./services/jobs');

const connection = new IORedis(process.env.REDIS_URL || 'redis://127.0.0.1:6379');
const queueName = 'gmail-sync';
new QueueScheduler(queueName, { connection });
const queue = new Queue(queueName, { connection });

async function bootstrap() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Worker connected to MongoDB');

  const worker = new Worker(queueName, async (job) => {
    const { userId, maxResults = 100 } = job.data;
    // Assumes credentials already set for gmail in an upstream step per user
    const emails = await fetchNewJobApplicationEmails(maxResults);
    for (const email of emails) {
      const parsed = parseJobEmail(email);
      await upsertJobFromParsed(userId, parsed);
    }
    return { processed: emails.length };
  }, { connection });

  worker.on('completed', (job, result) => {
    console.log(`Job ${job.id} completed:`, result);
  });
  worker.on('failed', (job, err) => {
    console.error(`Job ${job?.id} failed:`, err);
  });

  console.log('Worker started');
}

bootstrap().catch((e) => {
  console.error('Worker bootstrap error', e);
  process.exit(1);
});


