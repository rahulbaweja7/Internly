require('dotenv').config();
const mongoose = require('mongoose');
const app = require('./app');
const logger = require('./utils/logger');

const PORT = process.env.PORT || 3001;
const REMINDER_INTERVAL_MS = 24 * 60 * 60 * 1000;

// ── Global safety nets ────────────────────────────────────────────────────
// Unhandled rejections (async throws with no .catch()) would otherwise
// crash the process in Node 22, triggering Render's restart loop.
process.on('unhandledRejection', (reason) => {
  logger.error({ err: reason }, '[PROCESS] Unhandled promise rejection');
  // Don't exit — log and keep running. If the app is truly broken,
  // the health check will fail and Render will restart intentionally.
});

// Uncaught sync exceptions — these are genuinely unrecoverable, exit cleanly.
process.on('uncaughtException', (err) => {
  logger.fatal({ err }, '[PROCESS] Uncaught exception');
  process.exit(1);
});

// ── Startup helpers ───────────────────────────────────────────────────────
function startFallbackSchedule() {
  try {
    const { runReminders } = require('./utils/reminderService');
    setTimeout(() => {
      runReminders().catch(e => logger.error({ err: e }, '[reminders] fallback run failed'));
      setInterval(() => {
        runReminders().catch(e => logger.error({ err: e }, '[reminders] fallback run failed'));
      }, REMINDER_INTERVAL_MS);
    }, 60 * 60 * 1000);
  } catch (e) {
    logger.error({ err: e }, '[reminders] Failed to start fallback schedule');
  }
}

async function startReminders() {
  if (process.env.NODE_ENV === 'test') return;
  try {
    if (process.env.REDIS_URL) {
      const reminderQueue = require('./queues/reminderQueue');
      const { startReminderWorker } = require('./workers/reminderWorker');
      const { startGmailScanWorker } = require('./workers/gmailScanWorker');
      startReminderWorker();
      startGmailScanWorker();
      await reminderQueue.add('daily-reminder', {}, { repeat: { every: REMINDER_INTERVAL_MS } });
      logger.info('[reminders] BullMQ worker + repeatable job registered');
      logger.info('[gmail-scan] BullMQ worker registered');
    } else {
      logger.info('[reminders] No REDIS_URL — using in-process scheduler');
      startFallbackSchedule();
    }
  } catch (err) {
    logger.error({ err }, '[reminders] Setup failed, falling back to setTimeout');
    startFallbackSchedule();
  }
}

// ── Boot ─────────────────────────────────────────────────────────────────
// Start Express first so Render's health check passes immediately.
// Connect to MongoDB in the background with retries — a slow Atlas cold-start
// on a free-tier spin-up was causing process.exit(1) and triggering crash loops.
async function connectWithRetry(uri, attempt = 1) {
  const MAX = 10;
  const DELAY_MS = 5000;
  try {
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 20000,
      socketTimeoutMS: 30000,
    });
    logger.info({ attempt }, '[boot] MongoDB connected');
  } catch (err) {
    logger.error({ err, attempt, max: MAX }, '[boot] MongoDB connection failed');
    if (attempt >= MAX) {
      logger.error('[boot] Could not connect to MongoDB after max retries — giving up');
      return; // don't exit; health check will show DB down
    }
    await new Promise(r => setTimeout(r, DELAY_MS));
    await connectWithRetry(uri, attempt + 1);
  }
}

async function boot() {
  // 1. Start HTTP server immediately so health checks pass during DB cold-start
  app.listen(PORT, () => logger.info({ port: PORT }, '[boot] Server running'));

  // 2. Connect to MongoDB in background (retries, never kills the process)
  connectWithRetry(process.env.MONGO_URI).then(() => startReminders());
}

boot();