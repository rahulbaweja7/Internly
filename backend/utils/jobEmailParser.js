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
  'taleo.net',
  'ultipro.com',
  'jobvite.com',
  'recruitee.com',
  'breezy.hr',
  'pinpoint.com',
  'teamtailor.com',
  'rippling.com',
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
  'angel.co',
  'dice.com',
  'monster.com',
  'careerbuilder.com',
  'ladders.com',
  'levels.fyi',
  'builtinnyc.com',
  'builtin.com',
  'otta.com',
  'workatastartup.com',
];

const ROLE_KEYWORDS = [
  // Core tech titles
  'engineer', 'developer', 'programmer', 'architect', 'devops', 'sre', 'sde', 'sdet',
  // Data & AI
  'scientist', 'analyst', 'data', 'ml', 'ai', 'machine learning', 'research', 'researcher',
  // Product & design
  'manager', 'designer', 'product', 'ux', 'ui',
  // Specializations
  'frontend', 'backend', 'full stack', 'fullstack', 'mobile', 'ios', 'android',
  'cloud', 'security', 'platform', 'infrastructure', 'embedded', 'firmware',
  // Short acronyms used in job titles
  'swe', 'mle', 'pm', 'qa',
  // Entry level
  'intern', 'internship', 'graduate', 'new grad', 'coop', 'co-op',
  // Other roles that appear in job apps
  'consultant', 'specialist', 'coordinator', 'associate', 'director', 'lead', 'principal', 'staff',
  'operations', 'marketing', 'finance', 'legal', 'sales', 'support',
];

const ROLE_STOPWORDS = new Set([
  'your','you','we','our','application','applied','status','update','thank','congratulations','offer',
  'assessment','interview','schedule','invite','draft','reminder','policy','receipt','invoice','discount',
  'webinar','newsletter','digest','reward','free','music','amazon','spotify','unsubscribe',
  'please','click','here','link','view','read','open','login','sign','connect',
]);

const COMPANY_STOPPHRASES = new Set([
  'home', 'this time', 'any time', 'time of order', 'you were added', 'works best', 'your earliest convenience',
  'involves equity and', 'after reviewing your', 'was only the', 'have impacted and', 'best match you',
  'search and future endeavors', 'weekend', 'opens up', 'opened up', 'no additional positions',
  'descriptions', 'insights',
  // Non-company strings that pattern-match as company names
  'your account', 'your profile', 'your email', 'your inbox', 'the team', 'our team',
  'the role', 'the position', 'your application', 'your candidacy', 'your submission',
  'this position', 'this role', 'this opportunity', 'other candidates', 'other applicants',
  'future opportunities', 'future roles', 'all applicants',
]);

const NOISE_TERMS = [
  'discount', 'free rewards', 'reward', 'receipt', 'invoice', 'order', 'cart', 'shipping', 'delivery',
  'coupon', 'sale', 'unsubscribe', 'insurance', 'policy', 'payment', 'bank',
  'facebook', 'instagram', 'twitter', 'linkedin notifications',
  'amazon music', 'spotify', 'youtube premium', 'netflix',
  'promo', 'promotional', 'exclusive deal',
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
      if (/^(ai|ml|ui|ux|qa|sde|sdet|pm|ds|swe|mle|sre|ios|llm)$/i.test(word)) return word.toUpperCase();
      // Preserve all-caps abbreviations like "AWS", "GCP", "SQL"
      if (/^[A-Z]{2,6}$/.test(word)) return word;
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(' ')
    .replace(/\bIi\b/g, 'II')
    .replace(/\bIii\b/g, 'III')
    .replace(/\bSr\b(?!\.)/g, 'Sr.')
    .replace(/\bJr\b(?!\.)/g, 'Jr.');
};

const htmlToText = (html) => {
  return html
    .replace(/<\s*br\s*\/?>(?!=)/gi, '\n')
    .replace(/<\s*\/p\s*>/gi, '\n')
    .replace(/<\s*\/div\s*>/gi, '\n')
    .replace(/<\s*\/li\s*>/gi, '\n')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&apos;|&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
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
  // Strip quoted reply chains to avoid parsing recruiter's previous email as signal
  const stripped = text.replace(/\n\s*>.*$/gm, '').replace(/\n[-]{3,}.*$/gm, '');
  return stripped.trim();
};

/**
 * Extracts the company name from the From header display name.
 * e.g., "Google Careers <noreply@greenhouse.io>" → "Google"
 * e.g., "Stripe <jobs@stripe.com>" → "Stripe"
 * Returns null for generic sender names or person names.
 */
const extractFromDisplayName = (fromHeader) => {
  const nameMatch = fromHeader.match(/^"?([^"<\n]+?)"?\s*</);
  if (!nameMatch) return null;
  const raw = nameMatch[1].trim();
  if (!raw || raw.length < 2) return null;

  // Skip purely generic names
  if (/^(noreply|no[\s.]reply|donotreply|do[\s.]not[\s.]reply|careers?|jobs?|recruiting|talent|hr|hello|support|info|team|notifications?|alerts?|mailer|bounce|updates?|news|apply|notify|sender|postmaster|admin)$/i.test(raw.trim())) return null;

  // Remove separators and function suffixes to isolate company name
  const cleaned = raw
    .replace(/\s*[|–—]\s*.+$/, '')  // "Stripe | Careers" → "Stripe"
    .replace(/\s+(careers?|recruiting|recruitment|talent(?:\s+acquisition)?|hr|human\s+resources|hiring|jobs?|team|notifications?|university\s+recruiting|campus\s+recruiting|early\s+careers?|university\s+programs?|people\s+team|talent\s+team|recruiting\s+team|engineering\s+team|talent\s+brand|employment)$/i, '')
    .trim();

  if (!cleaned || cleaned.length < 2) return null;
  // Must start with a capital letter (company names are capitalized)
  if (!/^[A-Z]/.test(cleaned)) return null;

  // Skip if it looks like a human name: exactly two words, each one capitalized short word
  const words = cleaned.split(/\s+/);
  if (words.length === 2 && words.every((w) => /^[A-Z][a-z]{1,12}$/.test(w))) return null;

  return cleaned;
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
    .replace(/[^\w\s&.'\-]/g, '')  // preserve apostrophes for "McDonald's", "O'Reilly"
    .trim();
  return toTitleCasePreserve(cleaned.split(' ').slice(0, 5).join(' '));
};

const cleanRole = (role) => {
  if (!role) return '';
  return toTitleCasePreserve(
    role
      .replace(/\sat\s+[^,\n]+/gi, '')
      .replace(/\son\s+(monday|tuesday|wednesday|thursday|friday|saturday|sunday)/gi, '')
      .replace(/\s+apply\s+to\s+similar\s+jobs\?/gi, '')
      .replace(/\b(full[-\s]?time|college\s+graduates?|new\s+grads?)\b/gi, '')
      .replace(/[^\w\s.\-&/]/g, '')  // preserve . - & / for "Sr. Engineer", "Full-Stack", "React/Node"
      .replace(/\s+/g, ' ')
      .trim()
  )
    .replace(/\bAnd\b/g, 'and')
    .replace(/\bOf\b/g, 'of')
    .replace(/\bTo\b/g, 'to')
    .replace(/\bThe\b/g, 'the');
};

const stripCompanyFromRole = (role, company) => {
  if (!role || !company || company === 'Unknown Company') return role;
  try {
    const esc = company.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return role.replace(new RegExp(`^${esc}(?:['']s)?\\s+`, 'i'), '').trim();
  } catch {
    return role;
  }
};

/**
 * Status inference — rejection is checked FIRST.
 *
 * Critical invariant: rejection emails frequently mention interview/assessment stages in passing
 * (e.g., "you were not selected for a technical interview"). Checking rejection before interview
 * stages prevents misclassification.
 */
const inferStatus = (text) => {
  const t = text.toLowerCase();
  const marketing = NOISE_TERMS.some((w) => t.includes(w)) || /(discount|coupon|reward|free|music|sale|promo)/i.test(t);

  // 1. REJECTION — checked first; rejection emails often mention interviews/assessments in passing
  if (/(regret to inform|regret to let you know|regret to say|unfortunately.{0,120}(not|no longer|unable|cannot|won't|will not|have not|didn't|did not|aren't|are not)|not (?:moving|proceeding|able to move) forward|no longer (?:being considered|under consideration|in consideration|moving forward)|not selected|not (?:a )?(?:fit|match) for|have (?:decided|chosen) to (?:pursue|move forward with) other|we(?:'ve| have) (?:decided|chosen) to (?:move forward with|pursue) other|position has been filled|we will not be (?:moving|proceeding)|(?:will not|won't) be moving forward|at this time we (?:are not|won't|will not|cannot)|go(?:ing)? in a different direction|decided to (?:move forward|continue) with (?:other|another)|won't be (?:moving|proceeding)|will not be able to (?:move|proceed)|after careful (?:review|consideration).{0,50}(not|unable|cannot)|we will be moving forward with other|we have decided not to|we aren't able to|we're not able to)/i.test(t)) return 'Rejected';

  // 2. ACCEPTED — specific phrases only; avoid "pleased to offer you an interview" false positives
  if (!marketing && /(offer letter|(?:extend|extending|extended|make|making).{0,20}(?:an? )?(?:formal )?offer|offer of (?:employment|admission)|verbal offer|written offer|we(?:'re| are) (?:pleased|excited|happy|delighted|thrilled) to (?:extend|make|present|give).{0,20}offer|congratulations.{0,80}(?:offer letter|joining|new role|start date)|you(?:'ve| have) been (?:selected|chosen).{0,30}(?:for the offer|to join|as our|an offer)|signed offer|compensation package)/i.test(t)) return 'Accepted';

  // 3. FINAL INTERVIEW
  if (/(final (?:interview|round)|onsite (?:interview|visit)|on.site (?:interview|visit)|super ?day)/i.test(t)) return 'Final Interview';

  // 4. TECHNICAL INTERVIEW
  if (/(technical interview|tech interview|technical screen|coding interview|virtual onsite|hirevue|video interview|video screen|take.?home (?:project|assignment|test|challenge|exercise)|recorded (?:video|interview)|one.?way (?:video|interview))/i.test(t)) return 'Technical Interview';

  // 5. PHONE / RECRUITER SCREEN
  if (/(phone (?:interview|screen|call)|screening call|recruiter (?:call|screen|chat)|initial (?:interview|screen|call)|introductory call|exploratory call|discovery call|we(?:'d| would) like to (?:connect|chat|speak|talk|schedule)|move(?:d)? (?:you )?(?:to the )?next (?:round|step|stage)|invite you to (?:chat|connect|speak|schedule))/i.test(t)) return 'Phone Interview';

  // 6. ONLINE ASSESSMENT — generic "assessment" alone excluded (too ambiguous)
  if (/(online assessment|\boa\b|coding (?:challenge|test|exercise|screen)|take.?home (?:assessment|project|challenge)|hackerrank|codesignal|codility|karat|please complete.{0,50}(?:assessment|test|challenge|exercise|task)|complete (?:the )?(?:following )?assessment)/i.test(t)) return 'Online Assessment';

  // 7. APPLIED — confirmation of receipt
  if (/(thank you for applying|application received|we received your application|successfully (?:submitted|applied)|your application (?:has been|was) (?:received|submitted)|applied to|you applied)/i.test(t)) return 'Applied';

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
    if (tokens.length === 0 || tokens.length > 8) return;
    const lower = phrase.toLowerCase();
    if (!ROLE_KEYWORDS.some((k) => lower.includes(k))) return;
    const stopRatio = tokens.filter((t) => ROLE_STOPWORDS.has(t.toLowerCase())).length / tokens.length;
    if (stopRatio > 0.4) return;
    candidates.push({ phrase, score: 0, sourceWeight });
  };

  const s = subject || '';
  // Subject: "Role - Action" format (e.g., "Software Engineer - Interview Invitation")
  const dashSubj = s.match(/^([A-Za-z][A-Za-z0-9 /&.\-]{3,60}?)\s*[-–|]\s*(?:interview|application|assessment|offer|invitation|update|next steps|your|congratulations)/i);
  if (dashSubj) pushCandidate(dashSubj[1].trim(), 3);

  // Subject role noun patterns
  (s.match(/([A-Za-z/&+\- ]{0,60}?(?:Internship|Intern))(?![A-Za-z])/gi) || []).forEach((m) => pushCandidate(m, 2));
  (s.match(/((?:[A-Za-z/&+\-]+\s+){0,5}(?:Engineer|Developer|Programmer|Designer|Scientist|Analyst|Manager|Researcher|Architect|Specialist|Consultant|Director|Lead|Principal|Staff)(?:\s+(?:Intern|Internship))?)/gi) || []).forEach((m) => pushCandidate(m, 2));

  for (const text of sources) {
    (text.match(/([A-Za-z/&+\- ]{0,60}?(?:Internship|Intern))(?![A-Za-z])/gi) || []).forEach((m) => pushCandidate(m, 1));
    (text.match(/((?:[A-Za-z/&+\-]+\s+){0,5}(?:Engineer|Developer|Programmer|Designer|Scientist|Analyst|Manager|Researcher|Architect|Specialist|Consultant|Director|Lead|Principal|Staff)(?:\s+(?:Intern|Internship))?)/gi) || []).forEach((m) => pushCandidate(m, 1));
    (text.match(/(?:\b\w+\b\s+){0,3}(?:engineer|developer|designer|scientist|analyst|manager|researcher|architect|specialist|frontend|backend|full\s*stack|data|security|devops|mobile|ios|android)(?:\s+\b\w+\b){0,3}/gi) || []).forEach((m) => pushCandidate(m, 1));
  }

  candidates.forEach((c) => {
    const lower = c.phrase.toLowerCase();
    if (/(internship|intern)\b/.test(lower)) c.score += 2;
    c.score += ROLE_KEYWORDS.reduce((acc, k) => acc + (lower.includes(k) ? 1 : 0), 0) * 0.2;
    c.score += c.sourceWeight;
    c.score -= Math.max(0, c.phrase.split(' ').length - 4) * 0.2;
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

  // ── Company extraction ──────────────────────────────────────────────────────
  // Priority: subject patterns > body "at X" > ATS body patterns > display name > domain
  let company = 'Unknown Company';
  let companySource = 'none';

  const subjCompanyPatterns = [
    // Job-board specific (LinkedIn, Indeed) — must come first to override generic patterns
    /application (?:was sent|was submitted) to ([^!,\n·]+)/i,         // LinkedIn
    /applied to ([^·\n]+?)\s*·/i,                                       // Indeed
    /(?:your )?application (?:for|to) [^\n]+ at ([A-Z][A-Za-z0-9&.\-\s]{1,60}?)(?:\.|,|!|\n|$)/i,
    // Standard thank-you patterns
    /you applied to ([^!,\n]+)/i,
    /thank you for applying to ([^!,\n]+)/i,
    /thank you for your application (?:to|at|with) ([^!,\n]+)/i,
    /thanks for applying to ([^!,\n]+)/i,
    /we received your application (?:to|at|for) ([^!,\n]+)/i,
    // Interview / offer context
    /interview (?:request|invitation|invite)?\s*(?:with|at|from)\s+([A-Z][A-Za-z0-9&.\-\s]{1,60}?)(?:\s+(?:for|[-–])|\.|,|!|\n|$)/i,
    /(?:your )?offer (?:from|at|with) ([A-Z][A-Za-z0-9&.\-\s]{1,60}?)(?:\.|,|!|\n|$)/i,
    /congratulations[^,\n]* (?:at|with|from) ([A-Z][A-Za-z0-9&.\-\s]{1,60}?)(?:\.|,|!|\n|$)/i,
    // Generic "application to/for X"
    /application (?:to|for|at|with) ([A-Z][A-Za-z0-9&.\-\s]{1,60}?)(?:\.|,|!|\n|$)/i,
    /for the [^\n]+ at ([A-Z][A-Za-z0-9&.\-\s]{1,40}?)(?:\.|,|!|\n|$)/i,
    // Last-resort: "to Company" in subject
    /\bto\s+([A-Z][A-Za-z0-9&.\-\s]+?)\b(?:,|!|\.|\n|$)/i,
  ];
  for (const re of subjCompanyPatterns) {
    const m = subject.match(re);
    if (m) {
      company = m[1].trim();
      companySource = 'subject';
      break;
    }
  }

  // Body: "position/role/offer at Company" pattern
  if (company === 'Unknown Company') {
    const atMatch = combined.match(
      /(?:internship|position|role|offer|application|opportunity)\s+at\s+([A-Z][A-Za-z0-9&.\-\s]{1,60}?)(?:\s+on\s+[A-Za-z]+|\.|,|!|\?|\n|$)/i
    );
    if (atMatch) {
      company = atMatch[1].trim();
      companySource = 'body-at';
    }
  }

  // ATS & job-board body patterns (Greenhouse, Lever, Workday, Ashby, SmartRecruiters, LinkedIn, Indeed)
  if (company === 'Unknown Company') {
    const atsBodyPatterns = [
      /your application (?:to|at|with)\s+([A-Z][A-Za-z0-9&.\- ]{1,60}?)(?:\s+(?:for|has|is)|\.|,|!|\?|$)/i,
      /applying (?:to|at|with)\s+([A-Z][A-Za-z0-9&.\- ]{1,60}?)(?:\s+(?:for|as)|\.|,|!|\?|$)/i,
      /application (?:was sent|was submitted) to\s+([A-Z][A-Za-z0-9&.\- ]{1,60}?)(?:\s+(?:for|via)|\.|,|!|\?|$)/i,
      /team at\s+([A-Z][A-Za-z0-9&.\- ]{1,60}?)(?:'s?|\s+(?:and|is|has)|\.|,|!|\?|$)/i,
      /interest in (?:joining\s+)?([A-Z][A-Za-z0-9&.\- ]{1,60}?)(?:'s?|\s+(?:and|as|for)|\.|,|!|\?|$)/i,
      /welcome to\s+([A-Z][A-Za-z0-9&.\- ]{1,60}?)(?:'s?\s+(?:team|recruiting|hiring)|\.|,|!|\?|$)/i,
      /joining\s+([A-Z][A-Za-z0-9&.\- ]{1,60}?)(?:'s?\s+team|\s+as\b|\s+for\b|\.|,|!|\?|$)/i,
      /excited to (?:have you|welcome you)\s+(?:at|to|join)\s+([A-Z][A-Za-z0-9&.\- ]{1,60}?)(?:'s?|\.|,|!|\?|$)/i,
    ];
    for (const re of atsBodyPatterns) {
      const m = combined.match(re);
      if (m) {
        company = m[1].trim();
        companySource = 'body-ats';
        break;
      }
    }
  }

  // Display name extraction — catches ATS emails where company is embedded in sender display name
  // e.g., "Google Careers <no-reply@greenhouse.io>" → "Google"
  if (company === 'Unknown Company') {
    const displayNameCompany = extractFromDisplayName(from);
    if (displayNameCompany) {
      company = displayNameCompany;
      companySource = 'display-name';
    }
  }

  // Domain fallback (weakest signal — only fires when all other extraction fails)
  if (company === 'Unknown Company') {
    const domCompany = extractDomainCompany(from);
    if (domCompany) {
      company = domCompany;
      companySource = 'domain';
    }
  }

  company = cleanCompany(company);
  if (!company || COMPANY_STOPPHRASES.has(company.toLowerCase())) company = 'Unknown Company';

  // ── Role extraction ─────────────────────────────────────────────────────────
  let position = 'Unknown Position';

  // Subject-specific: "Role Name - Interview Invitation" / "Role Name | Phone Screen"
  const dashSubjRole = subject.match(
    /^([A-Za-z][A-Za-z0-9 /&.\-]{3,60}?)\s*[-–|]\s*(?:interview|application|assessment|offer|invitation|update|next steps|your|congratulations|we(?:'re| are)|phone|technical|onsite)/i
  );
  if (dashSubjRole && isLikelyRole(dashSubjRole[1])) {
    position = dashSubjRole[1].trim();
  }

  if (position === 'Unknown Position') {
    const rolePatterns = [
      // "role: [ROLE]" / "position: [ROLE]" / "title: [ROLE]"
      /(?:role|position|title|job\s+title)\s*:\s*(.{3,70}?)(?:\n|$|\.|,)/i,
      // "interview/assessment for [ROLE]"
      /(interview|assessment|oa) for\s+(?:the\s+|a\s+|an\s+)?(.+?)(?:\s+at\s+|\.|,|!|\n|$)/i,
      // "the [ROLE] position/role/opportunity"
      /(?:the|a|an)\s+(.{5,70}?)\s+(?:position|role|opportunity|opening)(?:\s+(?:at|with)\b|$|\.|,)/i,
      // "applying for the [ROLE]"
      /applying\s+(?:to|for)\s+(?:the\s+|a\s+|an\s+)?(.{5,70}?)(?:\s+(?:role|position|at)\b|\.|,|$)/i,
      // "as a/an [ROLE] at/with"
      /\bas\s+(?:a|an)\s+(.{5,70}?)(?:\s+at\b|\s+with\b|\.|,|!|\n|$)/i,
      // "hired as [ROLE]"
      /hired\s+as\s+(?:a\s+|an\s+)?(.{5,70}?)(?:\s+at\b|\.|,|$)/i,
      // "your application for [ROLE]" / "regarding [ROLE]"
      /(?:your application for|regarding)\s+(.+?)(?:\s+at\s+|\.|,|!|\n|$)/i,
      // "application for/to [ROLE]" / "applied to [ROLE]"
      /(?:application (?:for|to)|applied to|job)\s*:?\s+(.+?)(?:\s+at\s+|\.|,|!|\n|$)/i,
      // "for the [ROLE] role/position"
      /for the\s+(.+?)\s+(?:role|position)/i,
      // Common title patterns in subject/body
      /(software\s+engineer|frontend|backend|full\s*stack|data\s+scientist|product\s+manager|machine\s+learning)[^,\n]*?(?:intern|internship)?/i,
      // "internship - [role]"
      /(?:internship|intern)\s*(?:-\s*|:\s*|for\s+)?(.+?)(?:\s+at\s+|\.|,|!|\n|$)/i,
    ];
    for (const re of rolePatterns) {
      const m = combined.match(re);
      if (m) {
        const candidate = (m[2] || m[1] || '').toString().trim();
        if (candidate && isLikelyRole(candidate)) {
          position = candidate;
          break;
        }
      }
    }
  }

  if (position === 'Unknown Position') {
    // Subject: "[Something]: [Role detail]"
    const subjColon = subject.match(/^[^:]+:\s*(.+)$/i);
    if (subjColon && isLikelyRole(subjColon[1])) position = subjColon[1].trim();
  }

  if (position !== 'Unknown Position') position = cleanRole(position);

  // Fallback: choose best concise role-like phrase from all text sources
  if (position === 'Unknown Position') {
    const fallback = extractCandidateRoles(subject, snippet, bodyText);
    if (fallback) position = fallback;
  }

  // Remove leading company name from position
  position = stripCompanyFromRole(position, company);

  // Reject academic / non-job content masquerading as role names
  if (/(course|essay|graded|homework|assignment|syllabus|lecture|quiz|exam|module|academic|class\s+\d)/i.test(position)) {
    position = 'Unknown Position';
  }

  // ── Status ──────────────────────────────────────────────────────────────────
  const status = inferStatus(combined);

  // ── Date ────────────────────────────────────────────────────────────────────
  const emailDate = new Date(date);
  const formattedDate = isNaN(emailDate.getTime())
    ? new Date().toISOString().split('T')[0]
    : emailDate.toISOString().split('T')[0];

  // ── Confidence scoring ───────────────────────────────────────────────────────
  // Differentiated by extraction source — subject/ATS body signals are stronger than domain guesses
  let confidence = 0;
  if (company !== 'Unknown Company') {
    if (companySource === 'subject') confidence += 0.5;
    else if (companySource === 'display-name') confidence += 0.4;
    else if (companySource === 'body-ats') confidence += 0.4;
    else if (companySource === 'body-at') confidence += 0.3;
    else confidence += 0.15; // domain — weakest signal
  }
  if (position !== 'Unknown Position') confidence += 0.4;
  if (ATS_DOMAINS.some((d) => from.toLowerCase().includes(d))) confidence += 0.1;

  // ── Noise gate ───────────────────────────────────────────────────────────────
  const isLikelyNonApplication =
    /(newsletter|digest|webinar|virtual event|office hours|meet the team|hiring event|we are hiring|is hiring|job matches|job alert|jobs you might like|jobs you may like|new jobs for you|salary insights?|company reviews?|work anniversary|connection request|new message from|people you may know|your profile (?:was|has been) viewed|similar jobs|more jobs like this|see who(?:'s| is) hiring|company spotlight|recommendations|oauth application|has been added to your account|security alert|account activity|account notification|sign.?in attempt|new device|assignment graded|course grade|academic integrity|graded:|unsubscribe from this|verify your email|confirm your email|reset your password|your receipt|your order|your invoice|you have a promo|promotional offer|exclusive offer|limited.?time offer|special offer|hiring channel|welcome to our community|referral code|refer a friend|subscription confirmed|payment confirmed|auto.?renewal)/i.test(
      combinedLower
    );

  return {
    company,
    position: position || 'Unknown Position',
    status,
    appliedDate: formattedDate,
    emailId: email.id,
    subject,
    snippet,
    confidence,
    isLikelyNonApplication,
  };
};

module.exports = {
  parseJobEmail,
  STATUS_RANK,
  ATS_DOMAINS,
};
