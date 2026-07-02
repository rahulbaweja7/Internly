const { Worker } = require('bullmq');
const connection = require('../queues/connection');
const { createGmailService, parseJobApplicationFromEmail } = require('../gmailAuth');
const GmailToken = require('../models/GmailToken');
const logger = require('../utils/logger').child({ module: 'gmailScanWorker' });

// Detects OAuth token errors from the Google API
const isAuthError = (e) =>
  e?.message?.includes('invalid_grant') ||
  e?.message?.includes('Token has been expired') ||
  e?.message?.includes('invalid_credentials') ||
  e?.response?.data?.error === 'invalid_grant' ||
  e?.code === 401 ||
  e?.response?.status === 401;

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

      try {
        const gmailService = createGmailService(tokenDoc, userId);

        let rawEmails, newHistoryId;
        if (showAll) {
          ({ emails: rawEmails, historyId: newHistoryId } = await gmailService.fetchJobApplicationEmails(limit));
        } else {
          ({ emails: rawEmails, historyId: newHistoryId } = await gmailService.fetchNewJobApplicationEmails(limit, tokenDoc.historyId || null));
        }

        // Persist historyId cursor + stamp successful sync time
        const tokenUpdate = { lastSyncAt: new Date() };
        if (newHistoryId && newHistoryId !== tokenDoc.historyId) {
          tokenUpdate.historyId = newHistoryId;
        }
        // Clear any previous auth error flag on success
        if (tokenDoc.tokenInvalid) {
          tokenUpdate.tokenInvalid = false;
        }
        await GmailToken.findOneAndUpdate({ userId }, tokenUpdate);

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

        // Store results in Redis with 5-min TTL for polling endpoint
        await connection.set(`gmail_scan_result:${job.id}`, JSON.stringify({ applications: parsed }), 'EX', 300);

        logger.info({ jobId: job.id, userId, count: parsed.length }, 'Gmail scan complete');
        return { count: parsed.length };

      } catch (e) {
        if (isAuthError(e)) {
          // Mark the stored token as invalid so the next scan request fast-fails
          // and the frontend shows a reconnect CTA immediately.
          await GmailToken.findOneAndUpdate({ userId }, { tokenInvalid: true });

          // Store the auth error flag in Redis so the polling endpoint can surface requiresReconnect
          await connection.set(
            `gmail_scan_result:${job.id}`,
            JSON.stringify({ authError: true, error: e.message }),
            'EX',
            300
          );
          logger.warn({ jobId: job.id, userId, err: e }, 'Gmail scan failed: auth error — token marked invalid');
        } else {
          logger.error({ jobId: job.id, userId, err: e }, 'Gmail scan failed');
        }
        throw e; // re-throw so BullMQ records the job as failed
      }
    },
    {
      connection,
      concurrency: 5,
    }
  );

  worker.on('failed', (job, err) => {
    logger.error({ err, jobId: job?.id, userId: job?.data?.userId }, 'Gmail scan job failed');
  });

  return worker;
}

module.exports = { startGmailScanWorker };
