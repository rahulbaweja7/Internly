const { google } = require('googleapis');
require('dotenv').config();

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.REDIRECT_URI || `${process.env.BACKEND_URL || 'http://localhost:3001'}/api/gmail/oauth2callback`
);

// Debug logs to verify redirect URIs and env loading
try {
  // eslint-disable-next-line no-console
  console.log('[GMAIL] REDIRECT_URI env =', JSON.stringify(process.env.REDIRECT_URI));
  // eslint-disable-next-line no-console
  console.log('[GMAIL] oauth2Client redirectUri =', oauth2Client.redirectUri);
} catch (_) {}

const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

const generateAuthUrl = (state) => {
  const url = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',
    include_granted_scopes: false,
    scope: [
      'https://www.googleapis.com/auth/gmail.readonly',
    ],
    response_type: 'code',
    state,
  });
  try {
    // eslint-disable-next-line no-console
    console.log('[GMAIL] Generated auth URL =', url);
  } catch (_) {}
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

const fetchJobApplicationEmails = async (maxResults = 200) => {
  const query = 'category:primary -in:chats newer_than:1y ((subject:("application" OR "applied" OR "your application" OR "thank you for applying" OR "we received your application") OR ("applied to" OR "you applied to" OR "thanks for applying"))) -subject:("apply to similar jobs" OR "job matches" OR recommendations OR newsletter OR digest OR webinar OR "office hours" OR "hiring event" OR "virtual fair" OR "virtual event")';

  // List message IDs
  const list = await gmail.users.messages.list({ userId: 'me', q: query, maxResults });
  if (!list || !list.data) throw new Error('Empty response from Gmail API (messages.list)');
  const ids = (list.data.messages || []).map((m) => m.id);

  // Helpers
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const getWithRetry = async (id, attempt = 0) => {
    try {
      const m = await gmail.users.messages.get({ userId: 'me', id, format: 'full' });
      return m.data;
    } catch (e) {
      const status = e?.code || e?.response?.status;
      const isRate = status === 429 || e?.response?.data?.error?.status === 'RESOURCE_EXHAUSTED';
      if (isRate && attempt < 5) {
        const delay = 200 * Math.pow(2, attempt); // 200ms, 400ms, 800ms, 1.6s, 3.2s
        // eslint-disable-next-line no-console
        console.warn('[GMAIL] 429 on messages.get; backing off', { id, attempt, delayMs: delay });
        await sleep(delay);
        return getWithRetry(id, attempt + 1);
      }
      // eslint-disable-next-line no-console
      console.error('[GMAIL] messages.get failed', id, status, e?.message);
      return null;
    }
  };

  // Fetch with capped concurrency to avoid 429
  const emails = [];
  const concurrency = 8;
  for (let i = 0; i < ids.length; i += concurrency) {
    const chunk = ids.slice(i, i + concurrency);
    const results = await Promise.all(chunk.map((id) => getWithRetry(id)));
    emails.push(...results.filter(Boolean));
    await sleep(150); // small pacing gap between chunks
  }
  return emails;
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
const fetchNewJobApplicationEmails = async (maxResults = 200) => {
  const all = await fetchJobApplicationEmails(maxResults);
  const jobEmailIds = [
    ...(await Job.find({}, 'emailId statusHistory')).flatMap((j) => [j.emailId, ...(j.statusHistory || []).map((h) => h.emailId)]).filter(Boolean),
  ];
  const processedEmailIds = (await ProcessedEmail.find({}, 'emailId')).map((e) => e.emailId);
  const processed = new Set([...jobEmailIds, ...processedEmailIds]);
  return all.filter((e) => !processed.has(e.id));
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


