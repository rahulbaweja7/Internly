const express = require('express');
const logger = require('../utils/logger').child({ module: 'gmail-routes' });
const jwt = require('jsonwebtoken');
const { isAuthenticated } = require('../middleware/auth');
const { generateAuthUrl, getTokensFromCode, createGmailService, parseJobApplicationFromEmail } = require('../gmailAuth');
const GmailToken = require('../models/GmailToken');

// Lazy-load queue so tests that don't set REDIS_URL still run
const getScanQueue = () => {
  if (!process.env.REDIS_URL) return null;
  return require('../queues/gmailScanQueue');
};
const getRedis = () => {
  if (!process.env.REDIS_URL) return null;
  return require('../queues/connection');
};

const SCAN_COOLDOWN_MS = 60 * 1000; // 1 minute between scans per user

const router = express.Router();

// Step 1: Start OAuth
// Reads the user's JWT from the Authorization header or HttpOnly cookie,
// embeds their userId in a short-lived state token, then redirects to Google.
router.get('/auth', async (req, res) => {
  try {
    let token = null;
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) token = authHeader.substring(7);
    if (!token) {
      const cookieHeader = req.headers.cookie || '';
      const parts = cookieHeader.split(';').map((p) => p.trim());
      const tokenPart = parts.find((p) => p.startsWith('token='));
      token = tokenPart ? decodeURIComponent(tokenPart.split('=').slice(1).join('=')) : null;
    }
    if (!token) return res.status(401).json({ error: 'Not authenticated' });

    let userId = null;
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
      userId = String(decoded.id);
    } catch (_) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    const state = jwt.sign({ id: userId }, process.env.JWT_SECRET || 'your-secret-key', { expiresIn: '10m' });
    res.redirect(generateAuthUrl(state));
  } catch (e) {
    logger.error({ err: e }, 'Gmail /auth error');
    res.status(500).json({ error: 'Failed to start OAuth' });
  }
});

// Step 2: OAuth callback — exchange code for tokens, persist to DB
router.get('/oauth2callback', async (req, res) => {
  try {
    const { code, state } = req.query;
    if (!code || !state) return res.status(400).json({ error: 'Missing code or state' });

    let userId = null;
    try {
      const decoded = jwt.verify(state, process.env.JWT_SECRET || 'your-secret-key');
      userId = String(decoded.id);
    } catch (_) {
      return res.status(401).json({ error: 'Invalid auth state' });
    }

    const tokens = await getTokensFromCode(code);
    await GmailToken.findOneAndUpdate(
      { userId },
      {
        userId,
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        scope: tokens.scope,
        token_type: tokens.token_type,
        expiry_date: tokens.expiry_date,
        tokenInvalid: false, // clear any previous auth error on fresh connect
      },
      { upsert: true, new: true }
    );

    const frontendUrl = (process.env.FRONTEND_URL || 'http://localhost:3000').replace(/\/$/, '');
    res.redirect(`${frontendUrl}/settings?tab=integrations&gmail_connected=true`);
  } catch (error) {
    logger.error({ err: error }, 'Gmail OAuth callback error');
    const frontendUrl = (process.env.FRONTEND_URL || 'http://localhost:3000').replace(/\/$/, '');
    res.redirect(`${frontendUrl}/settings?tab=integrations&gmail_error=true`);
  }
});

// Step 3: Fetch job emails
// Each request creates an isolated OAuth2Client via createGmailService(),
// eliminating the race condition where concurrent users shared one global client.
router.get('/fetch-emails', isAuthenticated, async (req, res) => {
  try {
    const userId = String(req.user._id);
    const showAll = req.query.all === '1' || req.query.full === '1' || req.query.mode === 'full';
    const limit = Math.min(parseInt(req.query.limit || '200', 10) || 200, 1000);

    const tokenDoc = await GmailToken.findOne({ userId });
    if (!tokenDoc) return res.status(401).json({ error: 'Gmail not connected. Please authenticate first.' });

    // Per-request isolated client — no shared mutable state between users
    const gmailService = createGmailService(tokenDoc, userId);

    let rawEmails;
    let newHistoryId;

    if (showAll) {
      ({ emails: rawEmails, historyId: newHistoryId } = await gmailService.fetchJobApplicationEmails(limit));
    } else {
      ({ emails: rawEmails, historyId: newHistoryId } = await gmailService.fetchNewJobApplicationEmails(limit, tokenDoc.historyId || null));
    }

    // Persist updated historyId cursor for next incremental sync
    if (newHistoryId && newHistoryId !== tokenDoc.historyId) {
      await GmailToken.findOneAndUpdate(
        { userId },
        { historyId: newHistoryId, lastSyncAt: new Date() }
      );
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

    // Parse in chunks — yield to event loop between chunks to avoid blocking
    const CHUNK = 15;
    const parsed = [];
    for (let i = 0; i < latestEmails.length; i += CHUNK) {
      if (i > 0) await new Promise((resolve) => setImmediate(resolve));
      for (const { email } of latestEmails.slice(i, i + CHUNK)) {
        const app = parseJobApplicationFromEmail(email);
        if (app) parsed.push(app);
      }
    }

    res.json({ success: true, count: parsed.length, applications: parsed });
  } catch (error) {
    const gStatus = error?.response?.status || error?.code;
    const gBody = error?.response?.data;
    logger.error({ err: error, googleStatus: gStatus, googleError: gBody }, 'Error fetching emails');
    res.status(500).json({
      error: 'Failed to fetch emails',
      details: error?.message,
      googleStatus: gStatus,
      googleError: gBody,
    });
  }
});

// Step 4: Connection status
router.get('/status', isAuthenticated, async (req, res) => {
  try {
    const userId = String(req.user._id);
    const tokenDoc = await GmailToken.findOne({ userId });
    res.json({
      connected: !!tokenDoc,
      needsReconnect: tokenDoc?.tokenInvalid ?? false,
      lastConnected: tokenDoc ? tokenDoc.updatedAt : null,
      lastSyncAt: tokenDoc ? tokenDoc.lastSyncAt : null,
    });
  } catch (error) {
    logger.error({ err: error }, 'Error checking Gmail status');
    res.status(500).json({ error: 'Failed to check Gmail status' });
  }
});

// Step 5: Mark email as processed (won't appear in future scans)
const validate = require('../middleware/validate');
const { markProcessedSchema } = require('../schemas/gmail');

router.post('/mark-processed', isAuthenticated, validate(markProcessedSchema), async (req, res) => {
  try {
    const { emailId } = req.body;
    const userId = String(req.user._id);
    const ProcessedEmail = require('../models/ProcessedEmail');
    const existing = await ProcessedEmail.findOne({ emailId, userId });
    if (!existing) {
      await ProcessedEmail.create({ emailId, userId, processedAt: new Date() });
    }
    res.json({ success: true, emailId });
  } catch (error) {
    logger.error({ err: error }, 'Error marking email as processed');
    res.status(500).json({ error: 'Failed to mark email as processed' });
  }
});

// Step 6: Delete email from Gmail
router.delete('/delete-email/:emailId', isAuthenticated, async (req, res) => {
  try {
    const emailId = req.params.emailId;
    const userId = String(req.user._id);

    const tokenDoc = await GmailToken.findOne({ userId });
    if (!tokenDoc) return res.status(401).json({ error: 'Gmail not connected.' });

    // Per-request isolated client
    const gmailService = createGmailService(tokenDoc, userId);
    await gmailService.deleteEmail(emailId);

    res.json({ success: true, emailId });
  } catch (error) {
    logger.error({ err: error }, 'Error deleting email from Gmail');
    res.status(500).json({ error: 'Failed to delete email from Gmail' });
  }
});

// Step 8: Async scan — enqueues a BullMQ job and returns immediately.
// Replaces the blocking GET /fetch-emails for production traffic.
// Falls back to synchronous scan when Redis is not available (dev/staging).
router.post('/scan', isAuthenticated, async (req, res) => {
  try {
    const userId = String(req.user._id);
    const showAll = req.body.all === 1 || req.body.all === '1' || req.body.mode === 'full';
    const limit = Math.min(parseInt(req.body.limit || '200', 10) || 200, 1000);

    // Optional date range — both or neither; YYYY-MM-DD
    const { startDate, endDate } = req.body;
    const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
    if (startDate && !ISO_DATE.test(startDate)) return res.status(400).json({ error: 'startDate must be YYYY-MM-DD' });
    if (endDate && !ISO_DATE.test(endDate)) return res.status(400).json({ error: 'endDate must be YYYY-MM-DD' });
    if (startDate && endDate && startDate > endDate) return res.status(400).json({ error: 'startDate must be before endDate' });

    const tokenDoc = await GmailToken.findOne({ userId });
    if (!tokenDoc) return res.status(401).json({ error: 'Gmail not connected. Please authenticate first.' });

    // Fast-fail if the token is known to be invalid — no point enqueuing
    if (tokenDoc.tokenInvalid) {
      return res.status(401).json({
        error: 'Your Gmail connection has expired. Please reconnect.',
        requiresReconnect: true,
      });
    }

    // P6: rate limit — 60s between successful scans; 10s between any attempts (spam guard)
    const now = Date.now();
    if (tokenDoc.lastSyncAt) {
      const elapsed = now - new Date(tokenDoc.lastSyncAt).getTime();
      if (elapsed < SCAN_COOLDOWN_MS) {
        const retryAfter = Math.ceil((SCAN_COOLDOWN_MS - elapsed) / 1000);
        return res.status(429).json({
          error: `Please wait ${retryAfter}s before scanning again`,
          retryAfter,
        });
      }
    }

    const scanQueue = getScanQueue();

    if (!scanQueue) {
      // No Redis — fall back to synchronous scan (dev only)
      const gmailService = createGmailService(tokenDoc, userId);
      let rawEmails, newHistoryId;
      if (showAll || startDate || endDate) {
        ({ emails: rawEmails, historyId: newHistoryId } = await gmailService.fetchJobApplicationEmails(limit, startDate, endDate));
      } else {
        ({ emails: rawEmails, historyId: newHistoryId } = await gmailService.fetchNewJobApplicationEmails(limit, tokenDoc.historyId || null));
      }
      if (newHistoryId && newHistoryId !== tokenDoc.historyId) {
        await GmailToken.findOneAndUpdate({ userId }, { historyId: newHistoryId, lastSyncAt: new Date() });
      }
      const byThread = new Map();
      for (const email of rawEmails) {
        const ts = Number(email.internalDate || 0);
        const key = email.threadId || email.id;
        const prev = byThread.get(key);
        if (!prev || ts > prev.ts) byThread.set(key, { email, ts });
      }
      const parsed = Array.from(byThread.values())
        .sort((a, b) => b.ts - a.ts)
        .map(({ email }) => parseJobApplicationFromEmail(email))
        .filter(Boolean);
      return res.json({ scanId: null, state: 'completed', applications: parsed, count: parsed.length });
    }

    const job = await scanQueue.add('scan', { userId, showAll, limit, startDate: startDate || null, endDate: endDate || null });
    logger.info({ jobId: job.id, userId, startDate, endDate }, 'Gmail scan enqueued');
    res.json({ scanId: job.id });
  } catch (error) {
    logger.error({ err: error }, 'Failed to enqueue Gmail scan');
    res.status(500).json({ error: 'Failed to start scan' });
  }
});

// Step 9: Poll scan status — returns state + results when complete
router.get('/scan/:scanId', isAuthenticated, async (req, res) => {
  try {
    const { scanId } = req.params;
    const scanQueue = getScanQueue();
    const redis = getRedis();

    if (!scanQueue || !redis) {
      return res.status(404).json({ error: 'Queue not available' });
    }

    const job = await scanQueue.getJob(scanId);
    if (!job) return res.status(404).json({ error: 'Scan not found or expired' });

    const state = await job.getState(); // 'waiting' | 'active' | 'completed' | 'failed'

    if (state === 'failed') {
      // Check Redis for auth-error metadata written by the worker
      const raw = await redis.get(`gmail_scan_result:${scanId}`);
      const meta = raw ? JSON.parse(raw) : {};
      return res.json({
        scanId,
        state: 'failed',
        error: job.failedReason,
        requiresReconnect: !!meta.authError,
      });
    }

    if (state === 'completed') {
      const raw = await redis.get(`gmail_scan_result:${scanId}`);
      const meta = raw ? JSON.parse(raw) : {};
      const applications = meta.applications || [];
      return res.json({ scanId, state: 'completed', applications, count: applications.length });
    }

    // Still in progress
    const progress = job.progress || 0;
    res.json({ scanId, state, progress });
  } catch (error) {
    logger.error({ err: error }, 'Failed to poll scan status');
    res.status(500).json({ error: 'Failed to check scan status' });
  }
});

// Step 7: Disconnect
router.delete('/disconnect', isAuthenticated, async (req, res) => {
  try {
    const userId = String(req.user._id);
    await GmailToken.findOneAndDelete({ userId });
    res.json({ success: true });
  } catch (error) {
    logger.error({ err: error }, 'Error disconnecting Gmail');
    res.status(500).json({ error: 'Failed to disconnect Gmail' });
  }
});

module.exports = router;
