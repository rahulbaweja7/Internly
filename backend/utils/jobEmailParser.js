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
]);

const NOISE_TERMS = [
  'discount', 'free rewards', 'reward', 'receipt', 'invoice', 'order', 'cart', 'shipping', 'delivery', 'coupon', 'sale',
  'unsubscribe', 'insurance', 'policy', 'payment', 'bank', 'facebook', 'instagram', 'twitter', 'linkedin notifications',
  'amazon music', 'spotify', 'youtube premium', 'netflix',
];

const STATUS_RANK = {
  'Applied': 1,
  'Online Assessment': 2,
  'Interview': 3,
  'Accepted': 4,
  'Rejected': 4,
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
  if (!marketing && /(offer letter|extend(ed)? an offer|congratulations[^\n]*offer)/i.test(t)) return 'Accepted';
  if (/(final interview|onsite|technical interview|tech interview|phone interview|screening call|phone screen)/i.test(t)) return 'Interview';
  if (/(online assessment|assessment|hackerrank|coding challenge|oa)/i.test(t)) return 'Online Assessment';
  if (/(regret to inform|unfortunately|not moving forward|rejected)/i.test(t)) return 'Rejected';
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

  // Filter out likely non-application emails even if matched above
  const nonApplicationSignals = /(newsletter|digest|webinar|virtual event|office hours|meet the team|hiring event|we are hiring|is hiring|job matches|recommendations)/i.test(combinedLower);

  return {
    company,
    position: position || 'Unknown Position',
    status,
    appliedDate: formattedDate,
    emailId: email.id,
    subject,
    snippet,
    confidence,
    isLikelyNonApplication: nonApplicationSignals,
  };
};

module.exports = {
  parseJobEmail,
  STATUS_RANK,
  ATS_DOMAINS,
};


