const { Worker } = require('bullmq');
const connection = require('../queues/connection');
const { createGmailService, parseJobApplicationFromEmail } = require('../gmailAuth');
const GmailToken = require('../models/GmailToken');
const logger = require('../utils/logger').child({ module: 'gmailScanWorker' });

let worker;

function startGmailScanWorker() {
  if (process.env.NODE_ENV === 'test') return;

  worker = new Worker(
    'gmail-scan',
    async (job) => {
      const { userId, showAll, limit } = job.data;
      logger.info({ jobId: job.id, userId, showAll, limit }, 'Gmail scan started');

      const tokenDoc = await GmailToken.findOne({ userId });
      if (!tokenDoc) throw new Error('Gmail not connected');

      const gmailService = createGmailService(tokenDoc, userId);

      let rawEmails, newHistoryId;
      if (showAll) {
        ({ emails: rawEmails, historyId: newHistoryId } = await gmailService.fetchJobApplicationEmails(limit));
      } else {
        ({ emails: rawEmails, historyId: newHistoryId } = await gmailService.fetchNewJobApplicationEmails(limit, tokenDoc.historyId || null));
      }

      // Persist historyId cursor so the next incremental sync picks up from here
      if (newHistoryId && newHistoryId !== tokenDoc.historyId) {
        await GmailToken.findOneAndUpdate({ userId }, { historyId: newHistoryId, lastSyncAt: new Date() });
      }

      // Dedupe by thread — keep the latest message per thread
      const byThread = new Map();
      for (const email of rawEmails) {
        const ts = Number(email.internalDate || 0);
        const key = email.threadId || email.id;
        const prev = byThread.get(key);
        if (!prev || ts > prev.ts) byThread.set(key, { email, ts });
      }
      const latestEmails = Array.from(byThread.values()).sort((a, b) => b.ts - a.ts);

      // Parse in chunks — yield to event loop between chunks
      const CHUNK = 15;
      const parsed = [];
      for (let i = 0; i < latestEmails.length; i += CHUNK) {
        if (i > 0) await new Promise((r) => setImmediate(r));
        for (const { email } of latestEmails.slice(i, i + CHUNK)) {
          const app = parseJobApplicationFromEmail(email);
          if (app) parsed.push(app);
        }
      }

      // Store results in Redis with 5-min TTL so the polling endpoint can return them
      await connection.set(`gmail_scan_result:${job.id}`, JSON.stringify(parsed), 'EX', 300);

      logger.info({ jobId: job.id, userId, count: parsed.length }, 'Gmail scan complete');
      return { count: parsed.length };
    },
    {
      connection,
      concurrency: 5, // at most 5 concurrent Gmail scans
    }
  );

  worker.on('failed', (job, err) => {
    logger.error({ err, jobId: job?.id, userId: job?.data?.userId }, 'Gmail scan job failed');
  });

  return worker;
}

module.exports = { startGmailScanWorker };
