const { google } = require('googleapis');
require('dotenv').config();
const logger = require('./utils/logger').child({ module: 'gmail' });

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const REDIRECT_URI =
  process.env.REDIRECT_URI ||
  `${process.env.BACKEND_URL || 'http://localhost:3001'}/api/gmail/oauth2callback`;

// ── Bootstrap client ──────────────────────────────────────────────────────────
// Used ONLY for the OAuth handshake (generateAuthUrl, getTokensFromCode).
// It never holds a real user's tokens, so sharing it across requests is safe.
const bootstrapClient = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);

logger.debug({ redirectUri: REDIRECT_URI }, 'Gmail OAuth bootstrap client initialised');

// Subject-based keyword filters — date-independent portion of the Gmail search query.
const GMAIL_SUBJECT_FILTER =
  '(' +
    'subject:(' +
      '"application" OR "applied" OR "your application" OR "thank you for applying" OR ' +
      '"we received your application" OR "interview" OR "offer letter" OR "online assessment" OR ' +
      '"coding challenge" OR "take-home" OR "hackerrank" OR "codesignal" OR "hirevue" OR ' +
      '"phone screen" OR "screening call" OR "next steps" OR "moving forward" OR ' +
      '"unfortunately" OR "not selected" OR "other candidates" OR ' +
      '"internship" OR "new grad" OR "campus recruit"' +
    ') OR ' +
    '("applied to" OR "you applied to" OR "thanks for applying" OR "your candidacy")' +
  ') ' +
  '-subject:(' +
    '"apply to similar jobs" OR "job matches" OR recommendations OR newsletter OR digest OR ' +
    'webinar OR "office hours" OR "hiring event" OR "virtual fair" OR "virtual event" OR ' +
    '"is hiring" OR "we are hiring" OR "jobs you may like" OR ' +
    '"has been added to your account" OR "added to your account" OR ' +
    '"assignment graded" OR "graded:" OR "course grade" OR ' +
    '"verify your email" OR "confirm your email" OR "reset your password" OR ' +
    '"security alert" OR "account activity" OR "sign-in attempt"' +
  ')';

/**
 * Builds the full Gmail search query, injecting a date range or the default 1-year window.
 * @param {string} [startDate] ISO date string YYYY-MM-DD
 * @param {string} [endDate]   ISO date string YYYY-MM-DD
 */
const buildGmailQuery = (startDate, endDate) => {
  let dateFilter;
  if (startDate || endDate) {
    const parts = [];
    if (startDate) parts.push(`after:${startDate.replace(/-/g, '/')}`);
    if (endDate) parts.push(`before:${endDate.replace(/-/g, '/')}`);
    dateFilter = parts.join(' ');
  } else {
    dateFilter = 'newer_than:1y';
  }
  return `category:primary -in:chats ${dateFilter} ${GMAIL_SUBJECT_FILTER}`;
};

// ── OAuth helpers (use bootstrapClient — no user tokens involved) ─────────────

const generateAuthUrl = (state) => {
  const url = bootstrapClient.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',
    include_granted_scopes: false,
    scope: ['https://www.googleapis.com/auth/gmail.readonly'],
    response_type: 'code',
    state,
  });
  logger.debug({ url }, 'Generated Gmail auth URL');
  return url;
};

const getTokensFromCode = async (code) => {
  const { tokens } = await bootstrapClient.getToken(code);
  return tokens;
};

// ── Per-request Gmail service factory ────────────────────────────────────────
//
// Creates an isolated OAuth2Client for a single request/user.
// Fixes the race condition where the global client's credentials were overwritten
// by concurrent requests from different users.
//
// Also registers a `tokens` event listener so that when googleapis silently
// refreshes an expired access_token, the new token is persisted to MongoDB.
// Without this, users whose token expires would silently fail after 1 hour.

const createGmailService = (storedTokens, userId) => {
  const GmailToken = require('./models/GmailToken');

  const client = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);
  client.setCredentials({
    access_token: storedTokens.access_token,
    refresh_token: storedTokens.refresh_token,
    scope: storedTokens.scope,
    token_type: storedTokens.token_type,
    expiry_date: storedTokens.expiry_date,
  });

  // Persist auto-refreshed tokens back to DB so subsequent requests don't break
  client.on('tokens', async (newTokens) => {
    try {
      const update = {};
      if (newTokens.access_token) update.access_token = newTokens.access_token;
      if (newTokens.expiry_date) update.expiry_date = newTokens.expiry_date;
      if (newTokens.refresh_token) update.refresh_token = newTokens.refresh_token;
      if (Object.keys(update).length > 0) {
        await GmailToken.findOneAndUpdate({ userId }, update);
        logger.info({ userId }, 'Gmail access_token refreshed and persisted');
      }
    } catch (e) {
      logger.error({ err: e, userId }, 'Failed to persist refreshed Gmail tokens');
    }
  });

  const gmailApi = google.gmail({ version: 'v1', auth: client });

  // ── Internal helpers (closed over this request's gmailApi) ─────────────────

  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  /**
   * Returns message IDs matching the search query.
   * @param {number} maxResults
   * @param {string} [startDate] YYYY-MM-DD
   * @param {string} [endDate]   YYYY-MM-DD
   * @returns {{ ids: string[], historyId: string }}
   */
  const listJobEmailIds = async (maxResults = 200, startDate, endDate) => {
    const res = await gmailApi.users.messages.list({
      userId: 'me',
      q: buildGmailQuery(startDate, endDate),
      maxResults,
    });
    if (!res?.data) throw new Error('Empty response from Gmail API (messages.list)');
    return {
      ids: (res.data.messages || []).map((m) => m.id),
      historyId: res.data.historyId,
    };
  };

  /**
   * Returns IDs of messages added since startHistoryId.
   * Returns null if the historyId is too old (>30 days) — caller must full-sync.
   * @returns {{ ids: string[], historyId: string } | null}
   */
  const listNewEmailIdsSince = async (startHistoryId) => {
    try {
      const res = await gmailApi.users.history.list({
        userId: 'me',
        startHistoryId,
        historyTypes: ['messageAdded'],
        labelId: 'INBOX',
      });
      const addedIds = (res.data.history || [])
        .flatMap((h) => (h.messagesAdded || []).map((m) => m.message.id));
      return {
        ids: [...new Set(addedIds)],
        historyId: res.data.historyId || startHistoryId,
      };
    } catch (e) {
      if (e?.code === 404 || e?.response?.status === 404) {
        logger.warn({ startHistoryId, userId }, 'Gmail historyId expired — falling back to full sync');
        return null;
      }
      throw e;
    }
  };

  /**
   * Fetches full message content for the given IDs with exponential backoff
   * and capped concurrency (8 in-flight at a time, 150ms between batches).
   * @returns {object[]} Gmail message objects
   */
  const getEmailsByIds = async (ids) => {
    if (ids.length === 0) return [];

    const getWithRetry = async (id, attempt = 0) => {
      try {
        const m = await gmailApi.users.messages.get({ userId: 'me', id, format: 'full' });
        return m.data;
      } catch (e) {
        const status = e?.code || e?.response?.status;
        const isRate =
          status === 429 || e?.response?.data?.error?.status === 'RESOURCE_EXHAUSTED';
        if (isRate && attempt < 5) {
          const delay = 200 * Math.pow(2, attempt);
          logger.warn({ id, attempt, delayMs: delay, userId }, 'Gmail 429 — backing off');
          await sleep(delay);
          return getWithRetry(id, attempt + 1);
        }
        logger.error({ err: e, id, status, userId }, 'Gmail messages.get failed');
        return null;
      }
    };

    const emails = [];
    const CONCURRENCY = 8;
    for (let i = 0; i < ids.length; i += CONCURRENCY) {
      const chunk = ids.slice(i, i + CONCURRENCY);
      const results = await Promise.all(chunk.map((id) => getWithRetry(id)));
      emails.push(...results.filter(Boolean));
      if (i + CONCURRENCY < ids.length) await sleep(150);
    }
    return emails;
  };

  // ── Public service methods ──────────────────────────────────────────────────

  /**
   * Full sync — fetches content for all emails matching the search query.
   * Use for "show all" / "force refresh" / date-range modes.
   * @param {number} maxResults
   * @param {string} [startDate] YYYY-MM-DD
   * @param {string} [endDate]   YYYY-MM-DD
   * @returns {{ emails: object[], historyId: string }}
   */
  const fetchJobApplicationEmails = async (maxResults = 200, startDate, endDate) => {
    const { ids, historyId } = await listJobEmailIds(maxResults, startDate, endDate);
    const emails = await getEmailsByIds(ids);
    return { emails, historyId };
  };

  /**
   * Incremental sync — only fetches content for emails not already imported.
   *
   * Strategy:
   *   1. If a historyId cursor exists AND no date range, use history.list to get only new IDs.
   *   2. Otherwise (first sync, expired cursor, or date range) fall back to messages.list.
   *   3. Filter IDs against already-seen emails in DB BEFORE calling messages.get,
   *      so we only download content for genuinely new emails.
   *
   * Note: date range always forces a full scan because the history API has no date filter.
   *
   * @param {number} maxResults
   * @param {string|null} storedHistoryId
   * @param {string} [startDate] YYYY-MM-DD — forces full scan when set
   * @param {string} [endDate]   YYYY-MM-DD — forces full scan when set
   * @returns {{ emails: object[], historyId: string, stats: object }}
   */
  const fetchNewJobApplicationEmails = async (maxResults = 200, storedHistoryId = null, startDate, endDate) => {
    const Job = require('./models/Job');
    const ProcessedEmail = require('./models/ProcessedEmail');

    let candidateIds;
    let historyId;
    let mode;

    const hasDateRange = !!(startDate || endDate);

    if (storedHistoryId && !hasDateRange) {
      const result = await listNewEmailIdsSince(storedHistoryId);
      if (result) {
        candidateIds = result.ids;
        historyId = result.historyId;
        mode = 'incremental';
      } else {
        ({ ids: candidateIds, historyId } = await listJobEmailIds(maxResults));
        mode = 'full-fallback';
      }
    } else {
      ({ ids: candidateIds, historyId } = await listJobEmailIds(maxResults, startDate, endDate));
      mode = hasDateRange ? 'date-range' : 'full';
    }

    // Load all known email IDs from DB in parallel (2 queries, not N)
    const [jobEmailIds, processedEmailIds] = await Promise.all([
      Job.find({ userId }, 'emailId statusHistory').lean().then((jobs) =>
        jobs
          .flatMap((j) => [j.emailId, ...(j.statusHistory || []).map((h) => h.emailId)])
          .filter(Boolean)
      ),
      ProcessedEmail.find({ userId }, 'emailId').lean().then((docs) =>
        docs.map((e) => e.emailId)
      ),
    ]);

    const known = new Set([...jobEmailIds, ...processedEmailIds]);
    const newIds = candidateIds.filter((id) => !known.has(id));

    const stats = { mode, total: candidateIds.length, known: known.size, toFetch: newIds.length };
    logger.info({ ...stats, userId }, 'Gmail sync plan');

    const emails = await getEmailsByIds(newIds);
    return { emails, historyId, stats };
  };

  /**
   * Deletes a single email from the user's Gmail mailbox.
   */
  const deleteEmail = async (emailId) => {
    await gmailApi.users.messages.delete({ userId: 'me', id: emailId });
  };

  return { fetchJobApplicationEmails, fetchNewJobApplicationEmails, deleteEmail };
};

// ── Parser (stateless — no client needed) ────────────────────────────────────
const { parseJobEmail } = require('./utils/jobEmailParser');

const parseJobApplicationFromEmail = (email) => {
  try {
    const parsed = parseJobEmail(email);
    return {
      company: parsed.company,
      position: parsed.position,
      location: '',
      status: parsed.status,
      appliedDate: parsed.appliedDate,
      emailId: parsed.emailId,
      subject: parsed.subject,
      snippet: parsed.snippet,
    };
  } catch (e) {
    return null;
  }
};

module.exports = {
  generateAuthUrl,
  getTokensFromCode,
  createGmailService,
  parseJobApplicationFromEmail,
};
