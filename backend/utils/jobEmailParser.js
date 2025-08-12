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
  'Phone Interview': 3,
  'Technical Interview': 4,
  'Final Interview': 5,
  'Waitlisted': 6,
  'Accepted': 7,
  'Rejected': 7,
  'Withdrawn': 7,
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
      .replace(/[^\w\s]/g, '')
      .replace(/\s+/g, ' ')
      .trim()
  )
    .replace(/\bAnd\b/g, 'and')
    .replace(/\bOf\b/g, 'of')
    .replace(/\bTo\b/g, 'to');
};

const inferStatus = (text) => {
  const t = text.toLowerCase();
  // Avoid false positives from marketing "offer"
  const marketing = NOISE_TERMS.some((w) => t.includes(w)) || /(discount|coupon|reward|free|music|sale)/i.test(t);
  if (!marketing && /(offer letter|extend(ed)? an offer|congratulations[^\n]*offer)/i.test(t)) return 'Accepted';
  if (/(final interview|onsite)/i.test(t)) return 'Final Interview';
  if (/(technical interview|tech interview)/i.test(t)) return 'Technical Interview';
  if (/(phone interview|screening call|phone screen)/i.test(t)) return 'Phone Interview';
  if (/(online assessment|assessment|hackerrank|coding challenge|oa)/i.test(t)) return 'Online Assessment';
  if (/(regret to inform|unfortunately|not moving forward|rejected)/i.test(t)) return 'Rejected';
  if (/(waitlist|waitlisted|on hold)/i.test(t)) return 'Waitlisted';
  if (/(withdrawn|withdraw)/i.test(t)) return 'Withdrawn';
  if (/(thank you for applying|application received|we received your application|successfully submitted|your application)/i.test(t)) return 'Applied';
  return 'Applied';
};

const parseJobEmail = (email) => {
  const subject = email.payload?.headers?.find((h) => h.name === 'Subject')?.value || '';
  const from = email.payload?.headers?.find((h) => h.name === 'From')?.value || '';
  const date = email.payload?.headers?.find((h) => h.name === 'Date')?.value || '';
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
  if (position && !/intern|internship/i.test(position)) position += ' Intern';

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

  return {
    company,
    position: position || 'Unknown Position',
    status,
    appliedDate: formattedDate,
    emailId: email.id,
    subject,
    snippet,
    confidence,
  };
};

module.exports = {
  parseJobEmail,
  STATUS_RANK,
  ATS_DOMAINS,
};


