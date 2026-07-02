const { decodeWords } = require('libmime');
const he = require('he');

const ATS_DOMAINS = [
  'greenhouse.io',
  'boards.greenhouse.io',
  'lever.co',
  'myworkday.com',
  'workday.com',
  'ashbyhq.com',
  'smartrecruiters.com',
  'bamboohr.com',
  'successfactors.com',
  'icims.com',
  // Job boards — sender domain ≠ hiring company
  'linkedin.com',
  'indeedemail.com',
  'indeed.com',
  'glassdoor.com',
  'ziprecruiter.com',
  'joinhandshake.com',
  'handshake.com',
  'simplyhired.com',
  'wellfound.com',
];

const ROLE_KEYWORDS = [
  'engineer', 'developer', 'programmer', 'manager', 'designer', 'scientist', 'analyst',
  'researcher', 'product', 'frontend', 'backend', 'full stack', 'fullstack', 'mobile', 'ios', 'android',
  'data', 'ml', 'ai', 'qa', 'sde', 'sdet', 'security', 'devops', 'cloud', 'pm', 'ux', 'ui', 'support',
  'intern', 'internship', 'graduate', 'new grad', 'coop', 'co-op'
];

const ROLE_STOPWORDS = new Set([
  'your','you','we','our','application','applied','status','update','thank','congratulations','offer',
  'assessment','interview','schedule','invite','draft','reminder','policy','receipt','invoice','discount',
  'webinar','newsletter','digest','reward','free','music','amazon','spotify','unsubscribe'
]);

const COMPANY_STOPPHRASES = new Set([
  'home', 'this time', 'any time', 'time of order', 'you were added', 'works best', 'your earliest convenience',
  'involves equity and', 'after reviewing your', 'was only the', 'have impacted and', 'best match you', 'search and future endeavors',
  'weekend', 'opens up', 'opened up', 'no additional positions', 'descriptions', 'insights',
  // Non-company strings that pattern-match as company names
  'your account', 'your profile', 'your email', 'your inbox', 'the team', 'our team', 'the role', 'the position',
]);

const NOISE_TERMS = [
  'discount', 'free rewards', 'reward', 'receipt', 'invoice', 'order', 'cart', 'shipping', 'delivery', 'coupon', 'sale',
  'unsubscribe', 'insurance', 'policy', 'payment', 'bank', 'facebook', 'instagram', 'twitter', 'linkedin notifications',
  'amazon music', 'spotify', 'youtube premium', 'netflix', 'promo', 'promotional', 'exclusive deal',
];

const STATUS_RANK = {
  'Applied': 1,
  'Online Assessment': 2,
  'Phone Interview': 3,
  'Technical Interview': 4,
  'Final Interview': 5,
  'Accepted': 6,
  'Rejected': 6,
  'Waitlisted': 2,
  'Withdrawn': 0,
};

const decodeHeader = (v = '') => {
  try {
    return he.decode(decodeWords(v));
  } catch {
    return v;
  }
};

const toTitleCasePreserve = (text) => {
  if (!text) return '';
  return text
    .split(/\s+/)
    .map((word) => {
      if (word.length <= 2) return word.toUpperCase();
      if (/^(ai|ml|ui|ux|qa|sde|sdet|pm|ds)$/i.test(word)) return word.toUpperCase();
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(' ')
    .replace(/\bIi\b/g, 'II')
    .replace(/\bIii\b/g, 'III');
};

const htmlToText = (html) => {
  return html
    .replace(/<\s*br\s*\/?>(?!=)/gi, '\n')
    .replace(/<\s*\/p\s*>/gi, '\n')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&apos;|&#39;/g, "'")
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
    if (mimeType.includes('text/plain')) text += '\n' + content;
    else if (mimeType.includes('text/html')) text += '\n' + htmlToText(content);
  }
  return text.trim();
};

const extractDomainCompany = (fromHeader) => {
  try {
    const emailMatch = fromHeader.match(/<([^>]+)>/);
    const address = (emailMatch ? emailMatch[1] : fromHeader).trim();
    const domain = address.split('@')[1] || '';
    if (!domain) return null;
    if (ATS_DOMAINS.some((d) => domain.endsWith(d))) return null;
    const parts = domain.split('.');
    const core = parts.length >= 2 ? parts[parts.length - 2] : parts[0];
    if (!core) return null;
    return toTitleCasePreserve(core.replace(/[-_]/g, ' '));
  } catch {
    return null;
  }
};

const isLikelyRole = (text) => {
  const t = text.toLowerCase();
  return ROLE_KEYWORDS.some((k) => t.includes(k));
};

const cleanCompany = (name) => {
  if (!name) return '';
  const cleaned = name
    .replace(/\son\s+(monday|tuesday|wednesday|thursday|friday|saturday|sunday)/gi, '')
    .replace(/\s+team$/i, '')
    .replace(/\s+successfully submitted$/i, '')
    .replace(/\s+apply\s+to\s+similar\s+jobs\?/gi, '')
    .replace(/[^\w\s&.\-]/g, '')
    .trim();
  return toTitleCasePreserve(cleaned.split(' ').slice(0, 4).join(' '));
};

const cleanRole = (role) => {
  if (!role) return '';
  return toTitleCasePreserve(
    role
      .replace(/\sat\s+[^,\n]+/gi, '')
      .replace(/\son\s+(monday|tuesday|wednesday|thursday|friday|saturday|sunday)/gi, '')
      .replace(/\s+apply\s+to\s+similar\s+jobs\?/gi, '')
      .replace(/\b(full[-\s]?time|college\s+graduates?|new\s+grads?)\b/gi, '')
      .replace(/[^\w\s]/g, '')
      .replace(/\s+/g, ' ')
      .trim()
  )
    .replace(/\bAnd\b/g, 'and')
    .replace(/\bOf\b/g, 'of')
    .replace(/\bTo\b/g, 'to');
};

const stripCompanyFromRole = (role, company) => {
  if (!role || !company || company === 'Unknown Company') return role;
  try {
    const esc = company.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return role.replace(new RegExp(`^${esc}(?:['’]s)?\\s+`, 'i'), '').trim();
  } catch {
    return role;
  }
};

const inferStatus = (text) => {
  const t = text.toLowerCase();
  // Avoid false positives from marketing "offer"
  const marketing = NOISE_TERMS.some((w) => t.includes(w)) || /(discount|coupon|reward|free|music|sale)/i.test(t);
  if (!marketing && /(offer letter|extend(ed)? an offer|congratulations[^\n]*offer|excited to (?:extend|offer)|happy to (?:extend|offer)|pleased to (?:extend|offer)|you(?:'ve| have) been selected)/i.test(t)) return 'Accepted';
  if (/(final interview|onsite interview|final round)/i.test(t)) return 'Final Interview';
  if (/(technical interview|tech interview|technical screen|coding interview|virtual onsite|hirevue|video interview|video screen|take.?home (?:project|assignment|test))/i.test(t)) return 'Technical Interview';
  if (/(phone interview|phone screen|screening call|recruiter call|initial interview|we(?:'d| would) like to (?:connect|chat|speak|schedule)|move(?:d)? (?:you )?(?:to the )?next (?:round|step))/i.test(t)) return 'Phone Interview';
  if (/(online assessment|assessment|hackerrank|coding challenge|codesignal|take.home|\boa\b|please complete (?:the )?(?:following|this)|complete (?:your|the) assessment)/i.test(t)) return 'Online Assessment';
  if (/(regret to inform|unfortunately|not moving forward|rejected|no longer (?:being considered|under consideration)|position has been filled|we(?:'ve| have) (?:decided|chosen) to (?:move forward with|pursue) other)/i.test(t)) return 'Rejected';
  if (/(thank you for applying|application received|we received your application|successfully submitted|your application)/i.test(t)) return 'Applied';
  return 'Applied';
};

const extractCandidateRoles = (subject, snippet, bodyText) => {
  const sources = [subject || '', snippet || '', bodyText || ''];
  const candidates = [];
  const pushCandidate = (raw, sourceWeight = 0) => {
    if (!raw) return;
    let phrase = raw.trim();
    phrase = phrase.replace(/\s+/g, ' ');
    const tokens = phrase.split(' ');
    if (tokens.length === 0 || tokens.length > 7) return; // keep concise
    const lower = phrase.toLowerCase();
    // must include at least one role keyword
    if (!ROLE_KEYWORDS.some(k => lower.includes(k))) return;
    // filter if majority are stopwords or contains obvious non-role words
    const stopRatio = tokens.filter(t => ROLE_STOPWORDS.has(t.toLowerCase())).length / tokens.length;
    if (stopRatio > 0.4) return;
    candidates.push({ phrase, score: 0, sourceWeight });
  };

  // From subject: stronger weight
  const s = subject || '';
  // 1) Patterns ending with Intern/Internship
  (s.match(/([A-Za-z/&+\- ]{0,60}?(?:Internship|Intern))(?![A-Za-z])/gi) || []).forEach(m => pushCandidate(m, 2));
  // 2) Noun role patterns
  (s.match(/((?:[A-Za-z/&+\-]+\s+){0,4}(?:Engineer|Developer|Programmer|Designer|Scientist|Analyst|Manager|Researcher|Product)(?:\s+(?:Intern|Internship))?)/gi) || []).forEach(m => pushCandidate(m, 2));

  // From snippet/body: normal weight
  for (const text of sources) {
    // Intern/Internship enders
    (text.match(/([A-Za-z/&+\- ]{0,60}?(?:Internship|Intern))(?![A-Za-z])/gi) || []).forEach(m => pushCandidate(m, 1));
    // Role nouns window
    (text.match(/((?:[A-Za-z/&+\-]+\s+){0,4}(?:Engineer|Developer|Programmer|Designer|Scientist|Analyst|Manager|Researcher|Product)(?:\s+(?:Intern|Internship))?)/gi) || []).forEach(m => pushCandidate(m, 1));
    // Window around role keywords (up to 3 tokens on each side)
    (text.match(/(?:\b\w+\b\s+){0,3}(?:engineer|developer|designer|scientist|analyst|manager|researcher|product|frontend|backend|full\s*stack|data|security|devops|mobile|ios|android)(?:\s+\b\w+\b){0,3}/gi) || []).forEach(m => pushCandidate(m, 1));
  }

  // Score candidates: +2 if contains intern, +1 per extra role keyword, +sourceWeight, prefer shorter
  candidates.forEach(c => {
    const lower = c.phrase.toLowerCase();
    if (/(internship|intern)\b/.test(lower)) c.score += 2;
    c.score += ROLE_KEYWORDS.reduce((acc, k) => acc + (lower.includes(k) ? 1 : 0), 0) * 0.2;
    c.score += c.sourceWeight;
    c.score -= Math.max(0, c.phrase.split(' ').length - 4) * 0.2; // penalize long phrases
  });

  candidates.sort((a, b) => b.score - a.score || a.phrase.split(' ').length - b.phrase.split(' ').length);
  const best = candidates[0]?.phrase || '';
  return best ? cleanRole(best.replace(/\bInternship\b/i, 'Intern')) : '';
};

const parseJobEmail = (email) => {
  const subject = decodeHeader(email.payload?.headers?.find((h) => h.name === 'Subject')?.value || '');
  const from = decodeHeader(email.payload?.headers?.find((h) => h.name === 'From')?.value || '');
  const date = decodeHeader(email.payload?.headers?.find((h) => h.name === 'Date')?.value || '');
  const snippet = email.snippet || '';
  const bodyText = getEmailText(email);
  const combined = `${subject}\n${snippet}\n${bodyText}`;
  const combinedLower = combined.toLowerCase();

  // Company extraction
  let company = 'Unknown Company';
  const subjCompanyPatterns = [
    // Job-board specific (LinkedIn, Indeed) — must come first to override generic patterns
    /application (?:was sent|was submitted) to ([^!,\n·]+)/i,  // LinkedIn: "Your application was sent to Google"
    /applied to ([^·\n]+?)\s*·/i,                               // Indeed: "Applied to Google · Software Engineer"
    // Standard patterns
    /you applied to ([^!,\n]+)/i,
    /thank you for applying to ([^!,\n]+)/i,
    /thank you for your application to ([^!,\n]+)/i,
    /application to ([^!,\n]+)/i,
    /for the [^\n]+ at ([^!,\n]+)/i,
    /\bto\s+([A-Z][A-Za-z0-9&.\-\s]+?)\b(?:,|!|\.|\n|$)/i,
  ];
  for (const re of subjCompanyPatterns) {
    const m = subject.match(re);
    if (m) { company = m[1].trim(); break; }
  }
  if (company === 'Unknown Company') {
    const atMatch = combined.match(/(?:internship|position|role|offer|application)\s+at\s+([A-Z][A-Za-z0-9&.\-\s]+?)(?:\s+on\s+[A-Za-z]+|\s+\.|\.|,|!|\?|$)/i);
    if (atMatch) company = atMatch[1].trim();
  }
  // ATS & job-board body patterns (Greenhouse, Lever, Workday, Ashby, SmartRecruiters, LinkedIn, Indeed)
  if (company === 'Unknown Company') {
    const atsBodyPatterns = [
      /your application (?:to|at|with)\s+([A-Z][A-Za-z0-9&.\- ]+?)(?:\s+(?:for|has|is)|\.|,|!|\?|$)/i,
      /applying (?:to|at|with)\s+([A-Z][A-Za-z0-9&.\- ]+?)(?:\s+(?:for|as)|\.|,|!|\?|$)/i,
      /application (?:was sent|was submitted) to\s+([A-Z][A-Za-z0-9&.\- ]+?)(?:\s+(?:for|via)|\.|,|!|\?|$)/i,
      /team at\s+([A-Z][A-Za-z0-9&.\- ]+?)(?:'s?|\s+(?:and|is|has)|\.|,|!|\?|$)/i,
      /interest in (?:joining\s+)?([A-Z][A-Za-z0-9&.\- ]+?)(?:'s?|\s+(?:and|as|for)|\.|,|!|\?|$)/i,
      /welcome to\s+([A-Z][A-Za-z0-9&.\- ]+?)(?:'s?\s+(?:team|recruiting|hiring)|\.|,|!|\?|$)/i,
    ];
    for (const re of atsBodyPatterns) {
      const m = combined.match(re);
      if (m) { company = m[1].trim(); break; }
    }
  }
  if (company === 'Unknown Company') {
    const domCompany = extractDomainCompany(from);
    if (domCompany) company = domCompany;
  }
  company = cleanCompany(company);
  if (!company || COMPANY_STOPPHRASES.has(company.toLowerCase())) company = 'Unknown Company';

  // Role extraction
  let position = 'Unknown Position';
  const rolePatterns = [
    /(interview|assessment|oa) for\s+(.+?)(?:\s+at\s+|\.|,|!|\n|$)/i,
    /(application (?:for|to)|applied to|role|position|job):?\s+(.+?)(?:\s+at\s+|\.|,|!|\n|$)/i,
    /for the\s+(.+?)\s+(role|position)/i,
    /(your application for|regarding)\s+(.+?)(?:\s+at\s+|\.|,|!|\n|$)/i,
    /(software\s+engineer|frontend|backend|full\s*stack|data\s+scientist|product\s+manager)[^,\n]*?(?:intern|internship)?/i,
    /(internship|intern)\s*(?:-\s*|:\s*|for\s+)?(.+?)(?:\s+at\s+|\.|,|!|\n|$)/i,
  ];
  for (const re of rolePatterns) {
    const m = combined.match(re);
    if (m) {
      const c = (m[2] || m[1] || '').toString().trim();
      if (c && isLikelyRole(c)) { position = c; break; }
    }
  }
  if (position === 'Unknown Position') {
    const subjDash = subject.match(/\]\s*[^-]+-\s*(.+)$/i) || subject.match(/^[^:]+:\s*(.+)$/i);
    if (subjDash) position = subjDash[1].trim();
  }
  if (position !== 'Unknown Position') position = cleanRole(position);

  // Fallback: choose best concise role-like phrase instead of Unknown
  if (position === 'Unknown Position') {
    const fallback = extractCandidateRoles(subject, snippet, bodyText);
    if (fallback) position = fallback;
  }

  // Remove leading company name from position if present (e.g., "Old Mission's ...")
  position = stripCompanyFromRole(position, company);

  // Reject positions that are clearly not job titles (course names, academic content, etc.)
  if (/(course|essay|graded|homework|assignment|syllabus|lecture|quiz|exam|module|academic)/i.test(position)) {
    position = 'Unknown Position';
  }

  // Status
  const status = inferStatus(combined);

  // Date
  const emailDate = new Date(date);
  const formattedDate = isNaN(emailDate.getTime()) ? new Date().toISOString().split('T')[0] : emailDate.toISOString().split('T')[0];

  // Confidence scoring (simple)
  let confidence = 0;
  if (company !== 'Unknown Company') confidence += 0.4;
  if (position !== 'Unknown Position') confidence += 0.4;
  if (ATS_DOMAINS.some((d) => from.toLowerCase().includes(d))) confidence += 0.2;

  // Explicit noise signals — block even if a positive signal also matches
  const hasNoiseSignal = /(newsletter|digest|webinar|virtual event|office hours|meet the team|hiring event|we are hiring|is hiring|job matches|recommendations|oauth application|has been added to your account|security alert|account activity|account notification|assignment graded|course grade|academic integrity|graded:|unsubscribe from|verify your email|confirm your email|reset your password|your receipt|your order|your invoice|you have a promo|promotional offer|exclusive offer|limited time offer|special offer)/i.test(combinedLower);

  // Require at least one positive signal that the email is specifically about THIS user's job application.
  // Newsletters, promos, and hiring-market content discuss jobs in general — they won't have
  // "we received your application", "interview invitation", "your candidacy", etc.
  const POSITIVE_SIGNALS = [
    /thank you for (applying|your application|your interest in applying)/i,
    /thanks for (applying|your application)/i,
    /(we|i) received your application/i,
    /your application (has been|was) (received|submitted|sent|reviewed|updated)/i,
    /application (was sent|was submitted) to/i,
    /(interview invitation|schedule.{0,20}(an? )?interview|your (phone|technical|final|video|on.?site) interview)/i,
    /(offer letter|extend.{0,20}(an? )?offer|we.{0,30}offer you|job offer)/i,
    /(online assessment|coding (challenge|test)|hackerrank|codesignal|hirevue|take.?home (test|challenge|assignment|project))/i,
    /(phone screen|screening call|recruiter (call|screen|reach))/i,
    /(regret to inform|unfortunately.{0,60}(position|role|candidacy|application|moving forward)|not moving forward|no longer (being considered|under consideration)|not selected for|position has been filled)/i,
    /your candidacy/i,
    /(you applied|applied (to|for)) .{3,}/i,
    /(final round|onsite interview|virtual onsite)/i,
    /we.{0,40}(like to|want to|would like to).{0,30}(schedule|connect|chat|speak|interview)/i,
    /next steps in your (application|candidacy|process)/i,
    /move (you|forward) to the next (round|step)/i,
    /your application to .{3,}/i,
  ];
  const hasPositiveSignal = POSITIVE_SIGNALS.some((re) => re.test(combined));

  return {
    company,
    position: position || 'Unknown Position',
    status,
    appliedDate: formattedDate,
    emailId: email.id,
    subject,
    snippet,
    confidence,
    isLikelyNonApplication: hasNoiseSignal || !hasPositiveSignal,
  };
};

module.exports = {
  parseJobEmail,
  STATUS_RANK,
  ATS_DOMAINS,
};


