const { google } = require('googleapis');
require('dotenv').config();
const logger = require('./utils/logger').child({ module: 'gmail' });

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.REDIRECT_URI || `${process.env.BACKEND_URL || 'http://localhost:3001'}/api/gmail/oauth2callback`
);

logger.debug({ redirectUriEnv: process.env.REDIRECT_URI, clientRedirectUri: oauth2Client.redirectUri }, 'Gmail OAuth client initialised');

const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

// Single source of truth for the Gmail search query
const GMAIL_SEARCH_QUERY = 'category:primary -in:chats newer_than:1y ((subject:("application" OR "applied" OR "your application" OR "thank you for applying" OR "we received your application") OR ("applied to" OR "you applied to" OR "thanks for applying"))) -subject:("apply to similar jobs" OR "job matches" OR recommendations OR newsletter OR digest OR webinar OR "office hours" OR "hiring event" OR "virtual fair" OR "virtual event")';

const generateAuthUrl = (state) => {
  const url = oauth2Client.generateAuthUrl({
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
  const { tokens } = await oauth2Client.getToken(code);
  oauth2Client.setCredentials(tokens);
  return tokens;
};

const setCredentials = (tokens) => {
  oauth2Client.setCredentials(tokens);
};

// ── Primitives ────────────────────────────────────────────────────────────────

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * Returns message IDs matching our search query + the historyId cursor.
 * One API call regardless of how many messages exist.
 * @returns {{ ids: string[], historyId: string }}
 */
const listJobEmailIds = async (maxResults = 200) => {
  const res = await gmail.users.messages.list({ userId: 'me', q: GMAIL_SEARCH_QUERY, maxResults });
  if (!res?.data) throw new Error('Empty response from Gmail API (messages.list)');
  return {
    ids: (res.data.messages || []).map((m) => m.id),
    historyId: res.data.historyId,
  };
};

/**
 * Returns IDs of messages added to the mailbox since startHistoryId.
 * Does NOT filter by our search query — caller must handle non-job emails.
 * Returns null if the historyId is too old (>30 days) and a full sync is needed.
 * @returns {{ ids: string[], historyId: string } | null}
 */
const listNewEmailIdsSince = async (startHistoryId) => {
  try {
    const res = await gmail.users.history.list({
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
    // 404 means historyId expired; caller falls back to full messages.list
    if (e?.code === 404 || e?.response?.status === 404) {
      logger.warn({ startHistoryId }, 'Gmail historyId expired — falling back to full sync');
      return null;
    }
    throw e;
  }
};

/**
 * Fetches full message content for the given IDs with retry + capped concurrency.
 * @returns {object[]} Gmail message objects
 */
const getEmailsByIds = async (ids) => {
  if (ids.length === 0) return [];

  const getWithRetry = async (id, attempt = 0) => {
    try {
      const m = await gmail.users.messages.get({ userId: 'me', id, format: 'full' });
      return m.data;
    } catch (e) {
      const status = e?.code || e?.response?.status;
      const isRate = status === 429 || e?.response?.data?.error?.status === 'RESOURCE_EXHAUSTED';
      if (isRate && attempt < 5) {
        const delay = 200 * Math.pow(2, attempt);
        logger.warn({ id, attempt, delayMs: delay }, 'Gmail 429 — backing off');
        await sleep(delay);
        return getWithRetry(id, attempt + 1);
      }
      logger.error({ err: e, id, status }, 'Gmail messages.get failed');
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

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Full sync: fetches content for all emails matching the search query.
 * Use for "show all" / "force refresh" modes.
 * @returns {{ emails: object[], historyId: string }}
 */
const fetchJobApplicationEmails = async (maxResults = 200) => {
  const { ids, historyId } = await listJobEmailIds(maxResults);
  const emails = await getEmailsByIds(ids);
  return { emails, historyId };
};

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

const ProcessedEmail = require('./models/ProcessedEmail');
const Job = require('./models/Job');

/**
 * Incremental sync: only fetches content for emails not already imported.
 *
 * Strategy:
 *   1. If a historyId cursor is stored, use history.list to get only new message
 *      IDs since the last sync (1 API call instead of scanning all matches).
 *   2. Otherwise (first sync or expired cursor) fall back to messages.list with
 *      our search query.
 *   3. Either way, filter IDs against already-seen emails in DB BEFORE calling
 *      messages.get — so we only download content for genuinely new emails.
 *
 * @param {number} maxResults
 * @param {string|null} storedHistoryId - cursor from GmailToken.historyId
 * @returns {{ emails: object[], historyId: string, stats: object }}
 */
const fetchNewJobApplicationEmails = async (maxResults = 200, storedHistoryId = null) => {
  // Step 1: Get candidate IDs — incremental if we have a cursor, full otherwise
  let candidateIds;
  let historyId;
  let mode;

  if (storedHistoryId) {
    const result = await listNewEmailIdsSince(storedHistoryId);
    if (result) {
      candidateIds = result.ids;
      historyId = result.historyId;
      mode = 'incremental';
    } else {
      // historyId expired — fall back to full list
      ({ ids: candidateIds, historyId } = await listJobEmailIds(maxResults));
      mode = 'full-fallback';
    }
  } else {
    ({ ids: candidateIds, historyId } = await listJobEmailIds(maxResults));
    mode = 'full';
  }

  // Step 2: Load all known email IDs from DB in parallel (2 queries total, not N)
  const [jobEmailIds, processedEmailIds] = await Promise.all([
    Job.find({}, 'emailId statusHistory').lean().then((jobs) =>
      jobs.flatMap((j) => [j.emailId, ...(j.statusHistory || []).map((h) => h.emailId)]).filter(Boolean)
    ),
    ProcessedEmail.find({}, 'emailId').lean().then((docs) => docs.map((e) => e.emailId)),
  ]);

  const known = new Set([...jobEmailIds, ...processedEmailIds]);
  const newIds = candidateIds.filter((id) => !known.has(id));

  const stats = { mode, total: candidateIds.length, known: known.size, toFetch: newIds.length };
  logger.info(stats, 'Gmail sync plan');

  // Step 3: Only fetch content for genuinely new emails
  const emails = await getEmailsByIds(newIds);
  return { emails, historyId, stats };
};

module.exports = {
  oauth2Client,
  gmail,
  generateAuthUrl,
  getTokensFromCode,
  setCredentials,
  fetchJobApplicationEmails,
  fetchNewJobApplicationEmails,
  parseJobApplicationFromEmail,
};
