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

// ── Production env guard ──────────────────────────────────────────────────
// Refuse to boot if critical secrets are missing or still at their insecure
// defaults — a misconfigured deployment should fail loudly, not silently.
if (process.env.NODE_ENV === 'production') {
  const REQUIRED = ['JWT_SECRET', 'SESSION_SECRET', 'MONGO_URI'];
  for (const key of REQUIRED) {
    if (!process.env[key] || process.env[key] === 'your-secret-key') {
      logger.fatal({ key }, `[boot] ${key} is missing or default — refusing to start`);
      process.exit(1);
    }
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
  const server = app.listen(PORT, () => logger.info({ port: PORT }, '[boot] Server running'));

  // 2. Connect to MongoDB in background (retries, never kills the process)
  connectWithRetry(process.env.MONGO_URI).then(() => startReminders());

  // 3. Graceful shutdown — Render sends SIGTERM before replacing the instance.
  //    Stop accepting new connections, let in-flight requests finish (10s cap),
  //    then close the DB and exit so no user request is hard-killed mid-flight.
  const shutdown = (signal) => {
    logger.info({ signal }, '[shutdown] Signal received — draining connections');
    server.close(async () => {
      try {
        await mongoose.disconnect();
        logger.info('[shutdown] MongoDB disconnected — exiting cleanly');
      } catch (e) {
        logger.error({ err: e }, '[shutdown] Error during MongoDB disconnect');
      }
      process.exit(0);
    });
    // Force-exit if requests don't drain within 10 s
    setTimeout(() => {
      logger.warn('[shutdown] Drain timeout exceeded — forcing exit');
      process.exit(1);
    }, 10_000).unref();
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT',  () => shutdown('SIGINT'));
}

boot();