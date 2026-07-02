const { parseJobEmail } = require('../utils/jobEmailParser');

const makeEmail = ({ subject = '', from = 'noreply@company.com', snippet = '', body = '', date = 'Mon, 1 Jan 2024 12:00:00 +0000' } = {}) => ({
  id: 'test-id-123',
  threadId: 'thread-123',
  snippet,
  internalDate: '1704110400000',
  payload: {
    headers: [
      { name: 'Subject', value: subject },
      { name: 'From', value: from },
      { name: 'Date', value: date },
    ],
    parts: body ? [{
      mimeType: 'text/plain',
      body: { data: Buffer.from(body).toString('base64url') },
    }] : [],
  },
});

describe('parseJobEmail — status inference', () => {
  it('returns Applied for standard confirmation email', () => {
    const email = makeEmail({
      subject: 'Thank you for applying to Acme Corp',
      body: 'We received your application and will be in touch.',
    });
    const result = parseJobEmail(email);
    expect(result.status).toBe('Applied');
  });

  it('returns Rejected for rejection email', () => {
    const email = makeEmail({
      subject: 'Update on your application',
      body: 'We regret to inform you that we are not moving forward with your application at this time.',
    });
    const result = parseJobEmail(email);
    expect(result.status).toBe('Rejected');
  });

  it('returns Online Assessment for OA invite', () => {
    const email = makeEmail({
      subject: 'Software Engineer Internship — HackerRank Challenge',
      body: 'Please complete the online assessment within 7 days.',
    });
    const result = parseJobEmail(email);
    expect(result.status).toBe('Online Assessment');
  });

  it('returns Technical Interview for technical interview invite', () => {
    const email = makeEmail({
      subject: 'Interview Invitation — Technical Interview',
      body: 'We would like to invite you to a phone interview for the Software Engineer role.',
    });
    const result = parseJobEmail(email);
    expect(result.status).toBe('Technical Interview');
  });

  it('returns Accepted for offer letter', () => {
    const email = makeEmail({
      subject: 'Offer Letter — Congratulations!',
      body: 'We are pleased to extend an offer letter for the Software Engineer Intern position.',
    });
    const result = parseJobEmail(email);
    expect(result.status).toBe('Accepted');
  });

  it('does NOT classify marketing discount emails as Accepted', () => {
    const email = makeEmail({
      subject: 'Limited time offer — 50% discount!',
      body: 'This exclusive offer and discount is available for a short time only.',
    });
    const result = parseJobEmail(email);
    expect(result.status).not.toBe('Accepted');
  });

  it('returns Phone Interview for "next steps" recruiter email', () => {
    const email = makeEmail({
      subject: 'Next steps for your application',
      body: "We'd like to schedule a quick call to discuss the role further.",
    });
    const result = parseJobEmail(email);
    expect(result.status).toBe('Phone Interview');
  });

  it('returns Technical Interview for HireVue invite', () => {
    const email = makeEmail({
      subject: 'Complete your HireVue interview',
      body: 'Please complete your video interview at your earliest convenience.',
    });
    const result = parseJobEmail(email);
    expect(result.status).toBe('Technical Interview');
  });

  it('returns Rejected for "no longer being considered" email', () => {
    const email = makeEmail({
      subject: 'Update regarding your application',
      body: 'After careful consideration, you are no longer being considered for this position.',
    });
    const result = parseJobEmail(email);
    expect(result.status).toBe('Rejected');
  });

  it('returns Accepted for "excited to extend an offer" email', () => {
    const email = makeEmail({
      subject: 'Great news from Acme',
      body: 'We are excited to extend an offer for the Software Engineer role.',
    });
    const result = parseJobEmail(email);
    expect(result.status).toBe('Accepted');
  });

  it('returns Online Assessment for "please complete the following" email', () => {
    const email = makeEmail({
      subject: 'Action required: assessment',
      body: 'Please complete the following assessment to move forward in the process.',
    });
    const result = parseJobEmail(email);
    expect(result.status).toBe('Online Assessment');
  });
});

describe('parseJobEmail — company extraction', () => {
  it('extracts company from "you applied to X" subject', () => {
    const email = makeEmail({
      subject: 'You applied to Google',
      body: 'We received your application.',
    });
    const result = parseJobEmail(email);
    expect(result.company).toBe('Google');
  });

  it('extracts company from "thank you for applying to X" subject', () => {
    const email = makeEmail({
      subject: 'Thank you for applying to Stripe',
      body: 'Your application is under review.',
    });
    const result = parseJobEmail(email);
    expect(result.company).toBe('Stripe');
  });

  it('falls back to sender domain for company', () => {
    const email = makeEmail({
      subject: 'Your internship application',
      from: 'careers@acmecorp.com',
      body: 'Thank you for applying.',
    });
    const result = parseJobEmail(email);
    expect(result.company).toBe('Acmecorp');
  });

  it('does not use ATS domain as company name', () => {
    const email = makeEmail({
      subject: 'Software Engineer Intern — Meta',
      from: 'no-reply@greenhouse.io',
      body: 'Thank you for applying to Meta for the Software Engineer Intern role.',
    });
    const result = parseJobEmail(email);
    expect(result.company).not.toBe('Greenhouse');
  });

  it('does not use LinkedIn as company name', () => {
    const email = makeEmail({
      subject: 'Your application was sent to Google',
      from: 'jobs-noreply@linkedin.com',
      body: 'Your application was sent to Google.',
    });
    const result = parseJobEmail(email);
    expect(result.company).not.toBe('Linkedin');
  });

  it('extracts company from LinkedIn-style "application was sent to" subject', () => {
    const email = makeEmail({
      subject: 'Your application was sent to Stripe',
      from: 'jobs-noreply@linkedin.com',
      body: 'Your application has been sent.',
    });
    const result = parseJobEmail(email);
    expect(result.company).toBe('Stripe');
  });

  it('extracts company from Greenhouse body when ATS domain used', () => {
    const email = makeEmail({
      subject: 'Thank you for your application',
      from: 'noreply@greenhouse.io',
      body: 'Thank you for your application to Stripe for the Software Engineer Intern role.',
    });
    const result = parseJobEmail(email);
    expect(result.company).toBe('Stripe');
  });
});

describe('parseJobEmail — position extraction', () => {
  it('extracts role from "application for X" subject', () => {
    const email = makeEmail({
      subject: 'Application for Software Engineer Internship at Google',
      body: 'We received your application.',
    });
    const result = parseJobEmail(email);
    expect(result.position.toLowerCase()).toContain('engineer');
  });

  it('extracts role from "interview for X" body text', () => {
    const email = makeEmail({
      subject: 'Interview Invitation',
      body: 'We would like to schedule an interview for the Data Scientist Intern role at our company.',
    });
    const result = parseJobEmail(email);
    expect(result.position.toLowerCase()).toMatch(/data\s+scientist/);
  });
});

describe('parseJobEmail — non-application signal detection', () => {
  it('flags newsletter emails as non-application', () => {
    const email = makeEmail({
      subject: 'Weekly Jobs Newsletter',
      body: 'Check out this week\'s newsletter digest of job recommendations for you.',
    });
    const result = parseJobEmail(email);
    expect(result.isLikelyNonApplication).toBe(true);
  });

  it('does not flag legitimate application emails', () => {
    const email = makeEmail({
      subject: 'You applied to Airbnb',
      body: 'We received your application for the Software Engineer Intern role.',
    });
    const result = parseJobEmail(email);
    expect(result.isLikelyNonApplication).toBe(false);
  });
});

describe('parseJobEmail — output shape', () => {
  it('always returns required fields', () => {
    const email = makeEmail({ subject: 'Test Email' });
    const result = parseJobEmail(email);
    expect(result).toHaveProperty('company');
    expect(result).toHaveProperty('position');
    expect(result).toHaveProperty('status');
    expect(result).toHaveProperty('appliedDate');
    expect(result).toHaveProperty('emailId', 'test-id-123');
    expect(result).toHaveProperty('confidence');
    expect(result).toHaveProperty('isLikelyNonApplication');
  });

  it('confidence is higher when company and position are known', () => {
    const known = makeEmail({
      subject: 'You applied to Stripe',
      from: 'careers@stripe.com',
      body: 'Thank you for applying to the Software Engineer Intern role at Stripe.',
    });
    const unknown = makeEmail({ subject: 'Hello', body: 'Hello world' });
    expect(parseJobEmail(known).confidence).toBeGreaterThan(parseJobEmail(unknown).confidence);
  });
});
