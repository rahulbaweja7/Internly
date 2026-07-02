const request = require('supertest');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const GmailToken = require('../models/GmailToken');
const ProcessedEmail = require('../models/ProcessedEmail');

// Mock the entire gmailAuth module before app.js loads it.
// createGmailService now returns a per-request service object — the mock
// returns a shared `mockGmailService` that individual tests can control.
jest.mock('../gmailAuth', () => ({
  generateAuthUrl: jest.fn(() => 'https://accounts.google.com/o/oauth2/auth?mock=true'),
  getTokensFromCode: jest.fn(),
  createGmailService: jest.fn(),
  parseJobApplicationFromEmail: jest.fn(),
}));

const app = require('../app');
const { generateAuthUrl, getTokensFromCode, createGmailService, parseJobApplicationFromEmail } = require('../gmailAuth');

// ── Fixtures ──────────────────────────────────────────────────────────────────

const FAKE_TOKENS = {
  access_token: 'ya29.fake-access-token',
  refresh_token: '1//fake-refresh-token',
  scope: 'https://www.googleapis.com/auth/gmail.readonly',
  token_type: 'Bearer',
  expiry_date: Date.now() + 3600 * 1000,
};

const FAKE_EMAIL_OBJ = {
  id: 'msg_abc123',
  threadId: 'thread_abc123',
  internalDate: '1700000000000',
};

const FAKE_PARSED_APP = {
  company: 'Acme Corp',
  position: 'Software Engineer Intern',
  location: 'Remote',
  status: 'Applied',
  appliedDate: new Date().toISOString(),
  emailId: 'msg_abc123',
  subject: 'Your application to Acme Corp',
  snippet: 'Thank you for applying...',
};

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Creates a real User in the in-memory DB and returns { user, token }. */
async function createUser(overrides = {}) {
  const user = await User.create({
    name: 'Test User',
    email: `user-${Date.now()}@example.com`,
    password: 'password123',
    isEmailVerified: true,
    ...overrides,
  });
  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);
  return { user, token };
}

/** Stores a GmailToken for the given userId (string). */
async function connectGmail(userId, extra = {}) {
  return GmailToken.create({ userId: String(userId), ...FAKE_TOKENS, ...extra });
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('Gmail OAuth flow', () => {
  // Shared mock service — reset per test so each test controls its own responses
  let mockGmailService;

  beforeEach(() => {
    jest.clearAllMocks();

    // Build a fresh mock service object for each test
    mockGmailService = {
      fetchJobApplicationEmails: jest.fn().mockResolvedValue({ emails: [], historyId: 'h_001' }),
      fetchNewJobApplicationEmails: jest.fn().mockResolvedValue({ emails: [], historyId: 'h_001', stats: {} }),
      deleteEmail: jest.fn().mockResolvedValue(undefined),
    };
    createGmailService.mockReturnValue(mockGmailService);

    getTokensFromCode.mockResolvedValue(FAKE_TOKENS);
    parseJobApplicationFromEmail.mockReturnValue(null);
  });

  // ── Step 1: /auth ───────────────────────────────────────────────────────────

  describe('GET /api/gmail/auth', () => {
    it('redirects to Google OAuth URL when authenticated via Bearer token', async () => {
      const { token } = await createUser();

      const res = await request(app)
        .get('/api/gmail/auth')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(302);
      expect(res.headers.location).toContain('accounts.google.com');
      expect(generateAuthUrl).toHaveBeenCalledTimes(1);
      // state must be a JWT containing the user's id
      const stateJwt = generateAuthUrl.mock.calls[0][0];
      const decoded = jwt.verify(stateJwt, process.env.JWT_SECRET);
      expect(decoded).toHaveProperty('id');
    });

    it('redirects when authenticated via HttpOnly cookie', async () => {
      const { token } = await createUser();

      const res = await request(app)
        .get('/api/gmail/auth')
        .set('Cookie', `token=${encodeURIComponent(token)}`);

      expect(res.status).toBe(302);
      expect(res.headers.location).toContain('accounts.google.com');
    });

    it('returns 401 with no token at all', async () => {
      const res = await request(app).get('/api/gmail/auth');
      expect(res.status).toBe(401);
      expect(res.body.error).toBe('Not authenticated');
    });

    it('returns 401 with a malformed token', async () => {
      const res = await request(app)
        .get('/api/gmail/auth')
        .set('Authorization', 'Bearer not.a.real.jwt');
      expect(res.status).toBe(401);
      expect(res.body.error).toBe('Invalid token');
    });

    it('state JWT expires in ~10 minutes', async () => {
      const { token } = await createUser();
      await request(app)
        .get('/api/gmail/auth')
        .set('Authorization', `Bearer ${token}`);

      const stateJwt = generateAuthUrl.mock.calls[0][0];
      const decoded = jwt.decode(stateJwt);
      const ttlSeconds = decoded.exp - decoded.iat;
      expect(ttlSeconds).toBeLessThanOrEqual(600);
      expect(ttlSeconds).toBeGreaterThan(590);
    });
  });

  // ── Step 2: /oauth2callback ─────────────────────────────────────────────────

  describe('GET /api/gmail/oauth2callback', () => {
    it('stores tokens in DB and redirects to dashboard on success', async () => {
      const { user } = await createUser();
      const state = jwt.sign({ id: String(user._id) }, process.env.JWT_SECRET, { expiresIn: '10m' });

      const res = await request(app)
        .get('/api/gmail/oauth2callback')
        .query({ code: 'auth-code-from-google', state });

      expect(res.status).toBe(302);
      expect(res.headers.location).toContain('/dashboard?gmail_connected=true');

      const stored = await GmailToken.findOne({ userId: String(user._id) });
      expect(stored).not.toBeNull();
      expect(stored.access_token).toBe(FAKE_TOKENS.access_token);
      expect(stored.refresh_token).toBe(FAKE_TOKENS.refresh_token);
      expect(stored.token_type).toBe('Bearer');
    });

    it('upserts token on reconnect — does not create duplicate', async () => {
      const { user } = await createUser();
      const state = jwt.sign({ id: String(user._id) }, process.env.JWT_SECRET, { expiresIn: '10m' });

      await request(app).get('/api/gmail/oauth2callback').query({ code: 'code1', state });
      const newTokens = { ...FAKE_TOKENS, access_token: 'ya29.new-access-token' };
      getTokensFromCode.mockResolvedValueOnce(newTokens);
      await request(app).get('/api/gmail/oauth2callback').query({ code: 'code2', state });

      const docs = await GmailToken.find({ userId: String(user._id) });
      expect(docs).toHaveLength(1);
      expect(docs[0].access_token).toBe('ya29.new-access-token');
    });

    it('returns 400 when code is missing', async () => {
      const state = jwt.sign({ id: 'some-id' }, process.env.JWT_SECRET, { expiresIn: '10m' });
      const res = await request(app)
        .get('/api/gmail/oauth2callback')
        .query({ state });
      expect(res.status).toBe(400);
    });

    it('returns 400 when state is missing', async () => {
      const res = await request(app)
        .get('/api/gmail/oauth2callback')
        .query({ code: 'auth-code' });
      expect(res.status).toBe(400);
    });

    it('returns 401 when state JWT is invalid', async () => {
      const res = await request(app)
        .get('/api/gmail/oauth2callback')
        .query({ code: 'auth-code', state: 'not.a.valid.jwt' });
      expect(res.status).toBe(401);
      expect(res.body.error).toBe('Invalid auth state');
    });

    it('redirects to gmail_error=true when getTokensFromCode throws', async () => {
      const { user } = await createUser();
      const state = jwt.sign({ id: String(user._id) }, process.env.JWT_SECRET, { expiresIn: '10m' });
      getTokensFromCode.mockRejectedValueOnce(new Error('Google API error'));

      const res = await request(app)
        .get('/api/gmail/oauth2callback')
        .query({ code: 'bad-code', state });

      expect(res.status).toBe(302);
      expect(res.headers.location).toContain('gmail_error=true');
      const stored = await GmailToken.findOne({ userId: String(user._id) });
      expect(stored).toBeNull();
    });
  });

  // ── Step 3: /status ─────────────────────────────────────────────────────────

  describe('GET /api/gmail/status', () => {
    it('returns connected: false when no token stored', async () => {
      const { token } = await createUser();

      const res = await request(app)
        .get('/api/gmail/status')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(res.body.connected).toBe(false);
      expect(res.body.lastConnected).toBeNull();
    });

    it('returns connected: true and lastSyncAt when token exists', async () => {
      const { user, token } = await createUser();
      const lastSyncAt = new Date();
      await connectGmail(user._id, { lastSyncAt });

      const res = await request(app)
        .get('/api/gmail/status')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(res.body.connected).toBe(true);
      expect(res.body.lastConnected).not.toBeNull();
      expect(new Date(res.body.lastSyncAt).getTime()).toBeCloseTo(lastSyncAt.getTime(), -3);
    });

    it('returns 401 without auth', async () => {
      const res = await request(app).get('/api/gmail/status');
      expect(res.status).toBe(401);
    });
  });

  // ── Step 4: /fetch-emails ───────────────────────────────────────────────────

  describe('GET /api/gmail/fetch-emails', () => {
    it('returns 401 without auth', async () => {
      const res = await request(app).get('/api/gmail/fetch-emails');
      expect(res.status).toBe(401);
    });

    it('returns 401 when Gmail is not connected', async () => {
      const { token } = await createUser();

      const res = await request(app)
        .get('/api/gmail/fetch-emails')
        .set('Authorization', `Bearer ${token}`)
        .expect(401);

      expect(res.body.error).toMatch(/not connected/i);
    });

    it('returns parsed applications on successful incremental sync', async () => {
      const { user, token } = await createUser();
      await connectGmail(user._id);

      mockGmailService.fetchNewJobApplicationEmails.mockResolvedValueOnce({
        emails: [FAKE_EMAIL_OBJ],
        historyId: 'h_new',
        stats: { mode: 'full', total: 1, known: 0, toFetch: 1 },
      });
      parseJobApplicationFromEmail.mockReturnValueOnce(FAKE_PARSED_APP);

      const res = await request(app)
        .get('/api/gmail/fetch-emails')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.count).toBe(1);
      expect(res.body.applications[0].company).toBe('Acme Corp');
      expect(mockGmailService.fetchNewJobApplicationEmails).toHaveBeenCalledTimes(1);
    });

    it('persists the returned historyId for the next incremental sync', async () => {
      const { user, token } = await createUser();
      await connectGmail(user._id);

      mockGmailService.fetchNewJobApplicationEmails.mockResolvedValueOnce({
        emails: [],
        historyId: 'h_saved',
        stats: {},
      });

      await request(app)
        .get('/api/gmail/fetch-emails')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      const updated = await GmailToken.findOne({ userId: String(user._id) });
      expect(updated.historyId).toBe('h_saved');
      expect(updated.lastSyncAt).not.toBeNull();
    });

    it('passes stored historyId to fetchNewJobApplicationEmails on repeat sync', async () => {
      const { user, token } = await createUser();
      await connectGmail(user._id, { historyId: 'h_existing' });

      mockGmailService.fetchNewJobApplicationEmails.mockResolvedValueOnce({
        emails: [],
        historyId: 'h_existing',
        stats: {},
      });

      await request(app)
        .get('/api/gmail/fetch-emails')
        .set('Authorization', `Bearer ${token}`);

      expect(mockGmailService.fetchNewJobApplicationEmails).toHaveBeenCalledWith(
        expect.any(Number),
        'h_existing'
      );
    });

    it('uses full sync when ?all=1', async () => {
      const { user, token } = await createUser();
      await connectGmail(user._id);

      mockGmailService.fetchJobApplicationEmails.mockResolvedValueOnce({
        emails: [],
        historyId: 'h_full',
      });

      await request(app)
        .get('/api/gmail/fetch-emails?all=1')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(mockGmailService.fetchJobApplicationEmails).toHaveBeenCalledTimes(1);
      expect(mockGmailService.fetchNewJobApplicationEmails).not.toHaveBeenCalled();
    });

    it('dedupes emails in the same thread — keeps only latest', async () => {
      const { user, token } = await createUser();
      await connectGmail(user._id);

      const older = { ...FAKE_EMAIL_OBJ, id: 'msg_old', internalDate: '1000000000000' };
      const newer = { ...FAKE_EMAIL_OBJ, id: 'msg_new', internalDate: '2000000000000' };

      mockGmailService.fetchNewJobApplicationEmails.mockResolvedValueOnce({
        emails: [older, newer], // same threadId
        historyId: 'h_001',
        stats: {},
      });
      parseJobApplicationFromEmail.mockReturnValueOnce({ ...FAKE_PARSED_APP, emailId: 'msg_new' });

      const res = await request(app)
        .get('/api/gmail/fetch-emails')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      // parseJobApplicationFromEmail should only be called once (the newer message)
      expect(parseJobApplicationFromEmail).toHaveBeenCalledTimes(1);
      expect(res.body.count).toBe(1);
    });
  });

  // ── Step 5: /mark-processed ─────────────────────────────────────────────────

  describe('POST /api/gmail/mark-processed', () => {
    it('creates a ProcessedEmail record', async () => {
      const { user, token } = await createUser();

      await request(app)
        .post('/api/gmail/mark-processed')
        .set('Authorization', `Bearer ${token}`)
        .send({ emailId: 'msg_xyz' })
        .expect(200);

      const record = await ProcessedEmail.findOne({ emailId: 'msg_xyz', userId: String(user._id) });
      expect(record).not.toBeNull();
    });

    it('is idempotent — second call does not create a duplicate', async () => {
      const { user, token } = await createUser();

      await request(app)
        .post('/api/gmail/mark-processed')
        .set('Authorization', `Bearer ${token}`)
        .send({ emailId: 'msg_xyz' });

      await request(app)
        .post('/api/gmail/mark-processed')
        .set('Authorization', `Bearer ${token}`)
        .send({ emailId: 'msg_xyz' });

      const count = await ProcessedEmail.countDocuments({ emailId: 'msg_xyz', userId: String(user._id) });
      expect(count).toBe(1);
    });

    it('returns 400 when emailId is missing', async () => {
      const { token } = await createUser();

      const res = await request(app)
        .post('/api/gmail/mark-processed')
        .set('Authorization', `Bearer ${token}`)
        .send({});

      expect(res.status).toBe(400);
    });

    it('returns 401 without auth', async () => {
      const res = await request(app)
        .post('/api/gmail/mark-processed')
        .send({ emailId: 'msg_xyz' });
      expect(res.status).toBe(401);
    });
  });

  // ── Step 7: /disconnect ──────────────────────────────────────────────────────

  describe('DELETE /api/gmail/disconnect', () => {
    it('removes the GmailToken from DB', async () => {
      const { user, token } = await createUser();
      await connectGmail(user._id);

      await request(app)
        .delete('/api/gmail/disconnect')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      const stored = await GmailToken.findOne({ userId: String(user._id) });
      expect(stored).toBeNull();
    });

    it('status shows disconnected after disconnect', async () => {
      const { user, token } = await createUser();
      await connectGmail(user._id);

      await request(app)
        .delete('/api/gmail/disconnect')
        .set('Authorization', `Bearer ${token}`);

      const res = await request(app)
        .get('/api/gmail/status')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(res.body.connected).toBe(false);
    });

    it('returns 200 even when not connected (idempotent)', async () => {
      const { token } = await createUser();

      const res = await request(app)
        .delete('/api/gmail/disconnect')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
    });

    it('returns 401 without auth', async () => {
      const res = await request(app).delete('/api/gmail/disconnect');
      expect(res.status).toBe(401);
    });
  });

  // ── Full flow ────────────────────────────────────────────────────────────────

  describe('end-to-end: connect → sync → disconnect', () => {
    it('walks the complete happy path', async () => {
      const { user, token } = await createUser();

      // 1. Not connected
      let statusRes = await request(app)
        .get('/api/gmail/status')
        .set('Authorization', `Bearer ${token}`);
      expect(statusRes.body.connected).toBe(false);

      // 2. Start OAuth — get redirect to Google
      const authRes = await request(app)
        .get('/api/gmail/auth')
        .set('Authorization', `Bearer ${token}`);
      expect(authRes.status).toBe(302);

      // 3. Simulate Google callback — store tokens
      const state = jwt.sign({ id: String(user._id) }, process.env.JWT_SECRET, { expiresIn: '10m' });
      const callbackRes = await request(app)
        .get('/api/gmail/oauth2callback')
        .query({ code: 'auth-code', state });
      expect(callbackRes.status).toBe(302);
      expect(callbackRes.headers.location).toContain('gmail_connected=true');

      // 4. Now connected
      statusRes = await request(app)
        .get('/api/gmail/status')
        .set('Authorization', `Bearer ${token}`);
      expect(statusRes.body.connected).toBe(true);

      // 5. Fetch emails
      mockGmailService.fetchNewJobApplicationEmails.mockResolvedValueOnce({
        emails: [FAKE_EMAIL_OBJ],
        historyId: 'h_e2e',
        stats: {},
      });
      parseJobApplicationFromEmail.mockReturnValueOnce(FAKE_PARSED_APP);

      const fetchRes = await request(app)
        .get('/api/gmail/fetch-emails')
        .set('Authorization', `Bearer ${token}`);
      expect(fetchRes.body.count).toBe(1);

      // historyId persisted
      const tokenDoc = await GmailToken.findOne({ userId: String(user._id) });
      expect(tokenDoc.historyId).toBe('h_e2e');

      // 6. Disconnect
      await request(app)
        .delete('/api/gmail/disconnect')
        .set('Authorization', `Bearer ${token}`);

      statusRes = await request(app)
        .get('/api/gmail/status')
        .set('Authorization', `Bearer ${token}`);
      expect(statusRes.body.connected).toBe(false);
    });
  });
});
