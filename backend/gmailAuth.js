const { google } = require("googleapis");
const { parseJobEmail } = require('./utils/jobEmailParser');
require('dotenv').config();

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.REDIRECT_URI
);


const gmail = google.gmail({ version: "v1", auth: oauth2Client });

// Lightweight helpers (function declarations so they are hoisted)
function htmlToTextInline(html) {
  return (html || '')
    .replace(/<\s*br\s*\/?>(?!>)/gi, '\n')
    .replace(/<\s*\/p\s*>/gi, '\n')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim();
}

function extractPlainText(email) {
  try {
    const parts = [];
    (function walk(payload) {
      if (!payload) return;
      if (payload.parts && payload.parts.length) {
        payload.parts.forEach(walk);
      } else {
        parts.push(payload);
      }
    })(email?.payload);
    let text = '';
    for (const part of parts) {
      const mime = part?.mimeType || '';
      const data = part?.body?.data || '';
      if (!data) continue;
      const buffer = Buffer.from(data.replace(/-/g, '+').replace(/_/g, '/'), 'base64');
      const content = buffer.toString('utf8');
      if (mime.includes('text/plain')) text += '\n' + content;
      else if (mime.includes('text/html')) text += '\n' + htmlToTextInline(content);
    }
    return text.trim();
  } catch {
    return '';
  }
}

const generateAuthUrl = () => {
  return oauth2Client.generateAuthUrl({
    access_type: "offline",
    scope: [
      "https://www.googleapis.com/auth/gmail.readonly",
      "https://www.googleapis.com/auth/gmail.modify"
    ],
    prompt: "consent",
    include_granted_scopes: true,
    response_type: "code"
  });
};

// Function to get tokens from authorization code
const getTokensFromCode = async (code) => {
  try {
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);
    return tokens;
  } catch (error) {
    console.error('Error getting tokens:', error);
    throw error;
  }
};

// Function to set credentials from stored tokens
const setCredentials = (tokens) => {
  oauth2Client.setCredentials(tokens);
};

// Function to fetch recent emails with job application keywords
const fetchJobApplicationEmails = async (maxResults = 200) => {
  try {
    // Stricter Gmail search to focus on real applications in Primary inbox within last year
    const query = 'category:primary -in:chats newer_than:1y ((subject:("application" OR "applied" OR "your application" OR "thank you for applying" OR "we received your application") OR ("applied to" OR "you applied to" OR "thanks for applying"))) -subject:("apply to similar jobs" OR "job matches" OR "recommendations" OR newsletter OR digest OR webinar OR "office hours" OR "hiring event" OR "virtual fair" OR "virtual event")';
    
    console.log('Searching for emails containing "application"...');
    
    const messages = await gmail.users.messages.list({
      userId: "me",
      q: query,
      maxResults: maxResults
    });

    console.log('Found messages:', messages.data.messages?.length || 0);

    if (!messages.data.messages) {
      return [];
    }

    // Helper: delay
    const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
    // Helper: fetch a message with retry/backoff on 429
    const getMessageWithRetry = async (id, attempt = 0) => {
      try {
        const msg = await gmail.users.messages.get({ userId: 'me', id, format: 'full' });
        return msg.data;
      } catch (err) {
        const status = err?.code || err?.response?.status;
        const isRate = status === 429 || err?.response?.data?.error?.status === 'RESOURCE_EXHAUSTED';
        if (isRate && attempt < 5) {
          const delay = 250 * Math.pow(2, attempt); // 250ms, 500ms, 1s, 2s, 4s
          await sleep(delay);
          return getMessageWithRetry(id, attempt + 1);
        }
        console.error('Failed to fetch message', id, 'attempt', attempt, status);
        return null;
      }
    };

    // Get full message details with capped concurrency to avoid 429
    const ids = messages.data.messages.map(m => m.id);
    const emails = [];
    const concurrency = 10;
    for (let i = 0; i < ids.length; i += concurrency) {
      const chunk = ids.slice(i, i + concurrency);
      const chunkResults = await Promise.all(chunk.map((id) => getMessageWithRetry(id)));
      emails.push(...chunkResults.filter(Boolean));
      // small pacing gap between chunks
      await sleep(100);
    }
    console.log('Processed emails:', emails.length);
    
    // Filter emails to only include job application related ones
    const jobApplicationEmails = emails.filter(email => {
      const subject = email.payload?.headers?.find(h => h.name === 'Subject')?.value || '';
      const snippet = email.snippet || '';
      const body = extractPlainText(email);
      const fullText = (subject + ' ' + snippet + ' ' + body).toLowerCase();
      
      // Include emails that are likely job application related
      const isJobApplication = 
        fullText.includes('thank you for applying') ||
        fullText.includes('application received') ||
        fullText.includes('application submitted') ||
        fullText.includes('application has been received') ||
        fullText.includes('application successfully submitted') ||
        fullText.includes('we received your application') ||
        fullText.includes('your application has been received') ||
        fullText.includes('application is in review') ||
        fullText.includes('application will be reviewed') ||
        fullText.includes('application under review') ||
        fullText.includes('application confirmation') ||
        fullText.includes('application status') ||
        fullText.includes('interview') ||
        fullText.includes('online assessment') ||
        fullText.includes('next steps') ||
        fullText.includes('moving forward') ||
        fullText.includes('next round') ||
        fullText.includes('technical interview') ||
        fullText.includes('phone interview') ||
        fullText.includes('final interview') ||
        fullText.includes('coding challenge') ||
        fullText.includes('hackerrank') ||
        fullText.includes('leetcode') ||
        fullText.includes('accepted') ||
        fullText.includes('rejected') ||
        fullText.includes('waitlist') ||
        fullText.includes('offer') ||
        fullText.includes('position') ||
        fullText.includes('role') ||
        fullText.includes('internship') ||
        fullText.includes('intern') ||
        fullText.includes('software engineer') ||
        fullText.includes('frontend') ||
        fullText.includes('backend') ||
        fullText.includes('full stack') ||
        fullText.includes('data scientist') ||
        fullText.includes('product manager') ||
        fullText.includes('designer') ||
        fullText.includes('developer') ||
        fullText.includes('engineer');
      
      // Exclude obvious newsletters/marketing digests and general marketing/transactional emails
      const isNoise =
        fullText.includes('career brew') ||
        fullText.includes('hottest jobs') ||
        fullText.includes('do not miss') ||
        fullText.includes('newsletter') ||
        fullText.includes('digest') ||
        fullText.includes('roundup') ||
        fullText.includes('curated') ||
        fullText.includes('live q&a') ||
        fullText.includes('webinar') ||
        fullText.includes('office hours') ||
        fullText.includes('meet the team') ||
        fullText.includes('virtual event') ||
        fullText.includes('event reminder') ||
        fullText.includes('ask a recruiter') ||
        fullText.includes('your top job matches') ||
        fullText.includes('job matches') ||
        fullText.includes('matches for you') ||
        fullText.includes('jobs and internship jobs') ||
        fullText.includes('is hiring') ||
        fullText.includes('we are hiring') ||
        fullText.includes('meet our new') ||
        fullText.includes('verification code') ||
        fullText.includes('appointment booked') ||
        fullText.includes('discount') ||
        fullText.includes('driving score') ||
        fullText.includes('free rewards') ||
        fullText.includes('reward') ||
        fullText.includes('receipt') ||
        fullText.includes('invoice') ||
        fullText.includes('order') ||
        fullText.includes('cart') ||
        fullText.includes('shipping') ||
        fullText.includes('delivery') ||
        fullText.includes('coupon') ||
        fullText.includes('sale') ||
        fullText.includes('explore new opportunities') ||
        fullText.includes('unsubscribe') ||
        fullText.includes('insurance') ||
        fullText.includes('policy') ||
        fullText.includes('payment') ||
        fullText.includes('bank') ||
        fullText.includes('facebook') ||
        fullText.includes('instagram') ||
        fullText.includes('twitter') ||
        fullText.includes('linkedin notifications');

      // Treat ATS senders as high-signal application mail even if keywords are missing
      const from = email.payload?.headers?.find(h => h.name === 'From')?.value || '';
      const fromDomain = (from.match(/<([^>]+)>/)?.[1] || from).split('@')[1] || '';
      const atsDomains = ['greenhouse.io', 'boards.greenhouse.io', 'lever.co', 'workday.com', 'myworkday.com', 'ashbyhq.com', 'smartrecruiters.com', 'bamboohr.com', 'successfactors.com'];
      const isAtsSender = atsDomains.some(d => fromDomain.endsWith(d));

      // Additional job intent signals (focus on your application-related phrases)
      const jobSignalPhrases = [
        'thank you for applying',
        'thank you for your application',
        'we received your application',
        'application received',
        'application submitted',
        'successfully submitted',
        'application status',
        'your application',
        'applied to',
        'you applied to',
        'status update',
        'schedule interview',
        'interview',
        'online assessment',
        'assessment',
        'coding challenge',
        'hackerrank',
        'oa ',
        ' offer ',
        'congratulations',
        'final interview',
        'phone interview',
        'technical interview'
      ];
      const hasJobSignal = jobSignalPhrases.some(k => fullText.includes(k));

      // Keep if: ATS sender OR (has job signal and not clearly noise)
      if (isAtsSender) return true;
      if (hasJobSignal && !isNoise) return true;
      return false;
    });
    
    console.log('Filtered to job application emails:', jobApplicationEmails.length);
    return jobApplicationEmails;
  } catch (error) {
    console.error('Error fetching emails:', error);
    throw error;
  }
};

// Function to get processed email IDs from existing jobs
const getProcessedEmailIds = async () => {
  try {
    const Job = require('./models/Job');
    const ProcessedEmail = require('./models/ProcessedEmail');
    
    // Get email IDs from jobs that were added to tracker
    const existingJobs = await Job.find({}, 'emailId statusHistory');
    const jobEmailIds = [
      ...existingJobs.map(job => job.emailId).filter(id => id),
      ...existingJobs.flatMap(job => (job.statusHistory || []).map(h => h.emailId).filter(Boolean)),
    ];
    
    // Get email IDs that were marked as processed (but not added to tracker)
    const processedEmails = await ProcessedEmail.find({}, 'emailId');
    const processedEmailIds = processedEmails.map(email => email.emailId);
    
    // Combine both sets of processed email IDs
    const allProcessedIds = [...new Set([...jobEmailIds, ...processedEmailIds])];
    
    console.log('Found processed email IDs from jobs:', jobEmailIds.length);
    console.log('Found processed email IDs from marked emails:', processedEmailIds.length);
    console.log('Total processed email IDs:', allProcessedIds.length);
    console.log('Processed IDs:', allProcessedIds.slice(0, 5)); // Log first 5 for debugging
    
    return allProcessedIds;
  } catch (error) {
    console.error('Error getting processed email IDs:', error);
    return [];
  }
};

// Function to fetch only new job application emails
const fetchNewJobApplicationEmails = async (maxResults = 200) => {
  try {
    // Get all job application emails
    const allEmails = await fetchJobApplicationEmails(maxResults);
    
    // Get already processed email IDs
    const processedIds = await getProcessedEmailIds();
    
    console.log('Total emails found:', allEmails.length);
    console.log('Already processed emails:', processedIds.length);
    
    // Filter out already processed emails
    const newEmails = allEmails.filter(email => {
      const isProcessed = processedIds.includes(email.id);
      if (isProcessed) {
        console.log('Filtering out processed email:', email.id, 'Subject:', email.payload?.headers?.find(h => h.name === 'Subject')?.value);
      }
      return !isProcessed;
    });
    
    console.log('New emails found:', newEmails.length);
    
    // Log the first few new emails for debugging
    newEmails.slice(0, 3).forEach(email => {
      const subject = email.payload?.headers?.find(h => h.name === 'Subject')?.value;
      console.log('New email:', email.id, 'Subject:', subject);
    });
    
    return newEmails;
  } catch (error) {
    console.error('Error fetching new job application emails:', error);
    throw error;
  }
};

// Helpers
const toTitleCasePreserve = (text) => {
  if (!text) return '';
  return text
    .split(/\s+/)
    .map((word) => {
      if (word.length <= 2) return word.toUpperCase();
      // Preserve common acronyms
      if (/^(ai|ml|ui|ux|qa|sde|sdet|pm|ds)$/i.test(word)) return word.toUpperCase();
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(' ')
    .replace(/\bIi\b/g, 'II')
    .replace(/\bIii\b/g, 'III');
};

const extractDomainCompany = (fromHeader) => {
  try {
    // Examples: "Acme Careers <careers@acme.com>", "Greenhouse <no-reply@boards.greenhouse.io>"
    const emailMatch = fromHeader.match(/<([^>]+)>/);
    const address = (emailMatch ? emailMatch[1] : fromHeader).trim();
    const domain = address.split('@')[1] || '';
    if (!domain) return null;
    const atsDomains = [
      'greenhouse.io',
      'boards.greenhouse.io',
      'lever.co',
      'myworkday.com',
      'workday.com',
      'smartrecruiters.com',
      'successfactors.com',
      'rippling.com',
      'ashbyhq.com',
      'bamboohr.com',
    ];
    if (atsDomains.some((d) => domain.endsWith(d))) return null;
    const parts = domain.split('.');
    // take second-level label (e.g., acme.com -> acme, careers.acme.com -> acme)
    const core = parts.length >= 2 ? parts[parts.length - 2] : parts[0];
    if (!core) return null;
    return toTitleCasePreserve(core.replace(/[-_]/g, ' '));
  } catch {
    return null;
  }
};

const htmlToText = (html) => {
  return html
    .replace(/<\s*br\s*\/?>/gi, '\n')
    .replace(/<\s*\/p\s*>/gi, '\n')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim();
};

const getEmailText = (email) => {
  const getParts = (payload) => {
    if (!payload) return [];
    if (payload.parts && payload.parts.length > 0) {
      return payload.parts.flatMap((p) => getParts(p));
    }
    return [payload];
  };
  const parts = getParts(email.payload);
  let text = '';
  for (const part of parts) {
    const mimeType = part.mimeType || '';
    const bodyData = part.body && part.body.data ? part.body.data : '';
    if (!bodyData) continue;
    const buffer = Buffer.from(bodyData.replace(/-/g, '+').replace(/_/g, '/'), 'base64');
    const content = buffer.toString('utf8');
    if (mimeType.includes('text/plain')) {
      text += '\n' + content;
    } else if (mimeType.includes('text/html')) {
      text += '\n' + htmlToText(content);
    }
  }
  return text.trim();
};

// Function to parse job application data from email (delegates to parser util)
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
  } catch (err) {
    console.error('Error parsing email:', err);
    return {
      company: 'Unknown Company',
      position: 'Unknown Position',
      status: 'Applied',
      appliedDate: new Date().toISOString().split('T')[0],
      emailId: email.id,
      subject: '',
      snippet: ''
    };
  }
};

module.exports = {
  oauth2Client,
  gmail,
  generateAuthUrl,
  getTokensFromCode,
  setCredentials,
  fetchJobApplicationEmails,
  fetchNewJobApplicationEmails,
  parseJobApplicationFromEmail
}; 