const { google } = require('googleapis');
require('dotenv').config();

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.REDIRECT_URI || `${process.env.BACKEND_URL || 'http://localhost:3001'}/api/gmail/oauth2callback`
);

const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

const generateAuthUrl = (state) => {
  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: [
      'https://www.googleapis.com/auth/gmail.readonly',
      'https://www.googleapis.com/auth/gmail.modify',
      'openid', 'profile', 'email',
    ],
    prompt: 'consent',
    include_granted_scopes: true,
    response_type: 'code',
    state,
  });
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
  const list = await gmail.users.messages.list({ userId: 'me', q: query, maxResults });
  const ids = (list.data.messages || []).map((m) => m.id);
  const emails = await Promise.all(
    ids.map(async (id) => (await gmail.users.messages.get({ userId: 'me', id, format: 'full' })).data)
  );
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


