const { parseJobApplicationFromEmail } = require('../gmailAuth');

// Mirrors the fixture builder in emailParser.test.js — a realistic Gmail
// API message shape (headers + base64url body part).
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

describe('parseJobApplicationFromEmail', () => {
  it('reshapes a real application email into the tracker shape', () => {
    const result = parseJobApplicationFromEmail(makeEmail({
      subject: 'Thank you for applying to Acme Corp',
      from: 'careers@acme.com',
      body: 'We received your application for the Software Engineer role and will be in touch.',
    }));

    expect(result).not.toBeNull();
    expect(result.status).toBe('Applied');
    // Wrapper always sets location to '' regardless of what the parser found
    expect(result.location).toBe('');
    // Only the whitelisted fields are surfaced...
    expect(Object.keys(result).sort()).toEqual(
      ['appliedDate', 'company', 'emailId', 'location', 'position', 'snippet', 'status', 'subject'].sort()
    );
    // ...and the parser's internal scoring fields never leak through
    expect(result).not.toHaveProperty('confidence');
    expect(result).not.toHaveProperty('isLikelyNonApplication');
  });

  it('returns null for marketing/noise emails flagged as non-applications', () => {
    const result = parseJobApplicationFromEmail(makeEmail({
      subject: 'Limited time offer — 50% discount!',
      from: 'deals@shopping.com',
      body: 'This exclusive offer and discount is available for a short time only.',
    }));
    expect(result).toBeNull();
  });

  it('returns null when there is no extractable signal', () => {
    expect(parseJobApplicationFromEmail(makeEmail({}))).toBeNull();
  });

  it('returns null instead of throwing on a malformed email object', () => {
    expect(parseJobApplicationFromEmail(null)).toBeNull();
    expect(parseJobApplicationFromEmail({})).toBeNull();
  });
});
