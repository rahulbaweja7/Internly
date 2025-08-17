const express = require('express');
const jwt = require('jsonwebtoken');
const { isAuthenticated } = require('../middleware/auth');
const {
  generateAuthUrl,
  getTokensFromCode,
  setCredentials,
  fetchJobApplicationEmails,
  fetchNewJobApplicationEmails,
  parseJobApplicationFromEmail,
  gmail,
} = require('../gmailAuth');
const GmailToken = require('../models/GmailToken');

const router = express.Router();

// Step 1: Start OAuth – accept JWT via Authorization header or ?t= token (since redirects don't carry headers)
router.get('/auth', async (req, res) => {
  try {
    let token = null;
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) token = authHeader.substring(7);
    if (!token && req.query && req.query.t) token = String(req.query.t);
    if (!token) return res.status(401).json({ error: 'Not authenticated' });

    let userId = null;
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
      userId = String(decoded.id);
    } catch (_) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    const state = jwt.sign({ id: userId }, process.env.JWT_SECRET || 'your-secret-key', { expiresIn: '10m' });
    const url = generateAuthUrl(state);
    res.redirect(url);
  } catch (e) {
    console.error('Gmail /auth error:', e);
    res.status(500).json({ error: 'Failed to start OAuth' });
  }
});

// Step 2: OAuth callback
router.get('/oauth2callback', async (req, res) => {
  try {
    const { code, state } = req.query;
    if (!code || !state) return res.status(400).json({ error: 'Missing code or state' });

    let userId = null;
    try {
      const decoded = jwt.verify(state, process.env.JWT_SECRET || 'your-secret-key');
      userId = String(decoded.id);
    } catch (e) {
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
      },
      { upsert: true, new: true }
    );

    const rawUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const frontendUrl = rawUrl.replace(/\/$/, '');
    res.redirect(`${frontendUrl}/dashboard?gmail_connected=true`);
  } catch (error) {
    console.error('OAuth callback error:', error);
    const rawUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const frontendUrl = rawUrl.replace(/\/$/, '');
    res.redirect(`${frontendUrl}/dashboard?gmail_error=true`);
  }
});

// Step 3: Fetch job emails
router.get('/fetch-emails', isAuthenticated, async (req, res) => {
  try {
    const userId = String(req.user._id);
    const full = req.query.full === '1' || req.query.mode === 'full';
    const showAll = req.query.all === '1';
    const limit = Math.min(parseInt(req.query.limit || '200', 10) || 200, 1000);

    const tokenDoc = await GmailToken.findOne({ userId });
    if (!tokenDoc) return res.status(401).json({ error: 'Gmail not connected. Please authenticate first.' });

    setCredentials({
      access_token: tokenDoc.access_token,
      refresh_token: tokenDoc.refresh_token,
      scope: tokenDoc.scope,
      token_type: tokenDoc.token_type,
      expiry_date: tokenDoc.expiry_date,
    });

    const emails = showAll || full ? await fetchJobApplicationEmails(limit) : await fetchNewJobApplicationEmails(limit);

    // Parse and dedupe by thread (prefer latest)
    const byThread = new Map();
    for (const email of emails) {
      const ts = Number(email.internalDate || 0);
      const key = email.threadId || email.id;
      const prev = byThread.get(key);
      if (!prev || ts > prev.ts) byThread.set(key, { email, ts });
    }
    const latestEmails = Array.from(byThread.values()).sort((a, b) => b.ts - a.ts);

    const parsed = [];
    for (const { email } of latestEmails) {
      const app = parseJobApplicationFromEmail(email);
      if (!app) continue;
      if (!showAll) {
        const ProcessedEmail = require('../models/ProcessedEmail');
        const Job = require('../models/Job');
        const emailId = app.emailId || email.id;
        const [seenProc, seenJob] = await Promise.all([
          ProcessedEmail.findOne({ emailId, userId }).lean(),
          Job.findOne({ emailId }).lean(),
        ]);
        if (seenProc || seenJob) continue;
      }
      parsed.push(app);
    }

    res.json({ success: true, count: parsed.length, applications: parsed });
  } catch (error) {
    const gStatus = error?.response?.status || error?.code;
    const gBody = error?.response?.data;
    console.error('Error fetching emails:', {
      message: error?.message,
      status: gStatus,
      data: gBody,
    });
    res.status(500).json({ 
      error: 'Failed to fetch emails', 
      details: error?.message, 
      googleStatus: gStatus,
      googleError: gBody,
    });
  }
});

// Step 4: Status
router.get('/status', isAuthenticated, async (req, res) => {
  try {
    const userId = String(req.user._id);
    const tokenDoc = await GmailToken.findOne({ userId });
    res.json({ connected: !!tokenDoc, lastConnected: tokenDoc ? tokenDoc.updatedAt : null });
  } catch (error) {
    console.error('Error checking Gmail status:', error);
    res.status(500).json({ error: 'Failed to check Gmail status' });
  }
});

// Step 5: Mark processed
router.post('/mark-processed', isAuthenticated, async (req, res) => {
  try {
    const { emailId } = req.body || {};
    if (!emailId) return res.status(400).json({ error: 'emailId is required' });
    const userId = String(req.user._id);
    const ProcessedEmail = require('../models/ProcessedEmail');
    const existing = await ProcessedEmail.findOne({ emailId, userId });
    if (!existing) {
      await ProcessedEmail.create({ emailId, userId, processedAt: new Date() });
    }
    res.json({ success: true, emailId });
  } catch (error) {
    console.error('Error marking email as processed:', error);
    res.status(500).json({ error: 'Failed to mark email as processed' });
  }
});

// Step 6: Delete email from Gmail
router.delete('/delete-email/:emailId', isAuthenticated, async (req, res) => {
  try {
    const emailId = req.params.emailId;
    const userId = String(req.user._id);
    const tokenDoc = await GmailToken.findOne({ userId });
    if (!tokenDoc) return res.status(401).json({ error: 'Gmail not connected. Please authenticate first.' });
    setCredentials({
      access_token: tokenDoc.access_token,
      refresh_token: tokenDoc.refresh_token,
      scope: tokenDoc.scope,
      token_type: tokenDoc.token_type,
      expiry_date: tokenDoc.expiry_date,
    });
    await gmail.users.messages.delete({ userId: 'me', id: emailId });
    res.json({ success: true, emailId });
  } catch (error) {
    console.error('Error deleting email from Gmail:', error);
    res.status(500).json({ error: 'Failed to delete email from Gmail' });
  }
});

// Step 7: Disconnect
router.delete('/disconnect', isAuthenticated, async (req, res) => {
  try {
    const userId = String(req.user._id);
    await GmailToken.findOneAndDelete({ userId });
    res.json({ success: true });
  } catch (error) {
    console.error('Error disconnecting Gmail:', error);
    res.status(500).json({ error: 'Failed to disconnect Gmail' });
  }
});

module.exports = router;


