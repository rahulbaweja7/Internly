const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../app');
const User = require('../models/User');
const Job = require('../models/Job');

// ── Helpers ───────────────────────────────────────────────────────────────────

const CSRF_TOKEN = 'test-csrf-token-abc123';

/** Creates a real User in the in-memory DB and returns { user, token }. */
async function createUser(overrides = {}) {
  const user = await User.create({
    name: 'Test User',
    email: `user-${Date.now()}-${Math.random()}@example.com`,
    password: 'password123',
    isEmailVerified: true,
    ...overrides,
  });
  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);
  return { user, token };
}

/**
 * Returns a supertest request pre-configured with auth + CSRF headers.
 * Job routes sit after the CSRF middleware in app.js, so state-changing
 * requests (POST/PUT/DELETE) must mirror the csrf cookie in X-CSRF-Token.
 */
function authed(method, path, jwtToken) {
  return request(app)
    [method](path)
    .set('Authorization', `Bearer ${jwtToken}`)
    .set('Cookie', `csrf=${CSRF_TOKEN}`)
    .set('X-CSRF-Token', CSRF_TOKEN);
}

// ── GET /api/jobs ─────────────────────────────────────────────────────────────

describe('GET /api/jobs', () => {
  it('returns 401 without auth', async () => {
    const res = await request(app).get('/api/jobs');
    expect(res.status).toBe(401);
  });

  it('returns empty array when user has no jobs', async () => {
    const { token } = await createUser();
    const res = await request(app)
      .get('/api/jobs')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    expect(res.body).toEqual([]);
  });

  it('only returns jobs belonging to the authenticated user', async () => {
    const { user: u1, token: t1 } = await createUser();
    const { user: u2 } = await createUser();

    await Job.create({ userId: u1._id, company: 'Google', role: 'SWE Intern', status: 'Applied', normalizedCompany: 'google', normalizedRole: 'swe intern' });
    await Job.create({ userId: u2._id, company: 'Meta', role: 'PM Intern', status: 'Applied', normalizedCompany: 'meta', normalizedRole: 'pm intern' });

    const res = await request(app)
      .get('/api/jobs')
      .set('Authorization', `Bearer ${t1}`)
      .expect(200);

    expect(res.body).toHaveLength(1);
    expect(res.body[0].company).toBe('Google');
  });

  it('paginates when page and limit are provided', async () => {
    const { user, token } = await createUser();
    for (let i = 0; i < 5; i++) {
      await Job.create({
        userId: user._id,
        company: `Company ${i}`,
        role: 'SWE',
        status: 'Applied',
        normalizedCompany: `company ${i}`,
        normalizedRole: 'swe',
      });
    }

    // Paginated wrapper ({ jobs, total, pages }) is only returned with ?summary=1
    const res = await request(app)
      .get('/api/jobs?summary=1&page=1&limit=3')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(res.body.jobs).toHaveLength(3);
    expect(res.body.total).toBe(5);
    expect(res.body.pages).toBe(2);
  });

  it('returns trimmed statusHistory when ?summary=1', async () => {
    const { user, token } = await createUser();
    await Job.create({
      userId: user._id,
      company: 'Stripe',
      role: 'Backend Eng',
      status: 'Applied',
      normalizedCompany: 'stripe',
      normalizedRole: 'backend eng',
      statusHistory: [
        { status: 'Applied', at: new Date(), source: 'gmail' },
        { status: 'Online Assessment', at: new Date(), source: 'gmail' },
        { status: 'Technical Interview', at: new Date(), source: 'gmail' },
      ],
    });

    const res = await request(app)
      .get('/api/jobs?summary=1')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(res.body[0].statusHistory.length).toBeLessThanOrEqual(2);
  });
});

// ── POST /api/jobs ────────────────────────────────────────────────────────────

describe('POST /api/jobs', () => {
  it('returns 401 without auth', async () => {
    const res = await request(app)
      .post('/api/jobs')
      .set('Cookie', `csrf=${CSRF_TOKEN}`)
      .set('X-CSRF-Token', CSRF_TOKEN)
      .send({ company: 'Google', role: 'SWE Intern' });
    expect(res.status).toBe(401);
  });

  it('creates a new job and returns 201', async () => {
    const { token } = await createUser();
    const res = await authed('post', '/api/jobs', token)
      .send({ company: 'Google', role: 'SWE Intern', status: 'Applied' })
      .expect(201);

    expect(res.body.company).toBe('Google');
    expect(res.body.role).toBe('SWE Intern');
    expect(res.body.status).toBe('Applied');
  });

  it('returns 400 when company is missing', async () => {
    const { token } = await createUser();
    const res = await authed('post', '/api/jobs', token)
      .send({ role: 'SWE Intern' })
      .expect(400);

    expect(res.body.error).toMatch(/validation/i);
  });

  it('returns 400 when role is missing', async () => {
    const { token } = await createUser();
    const res = await authed('post', '/api/jobs', token)
      .send({ company: 'Google' })
      .expect(400);

    expect(res.body.error).toMatch(/validation/i);
  });

  it('returns 400 for an invalid status value', async () => {
    const { token } = await createUser();
    const res = await authed('post', '/api/jobs', token)
      .send({ company: 'Google', role: 'SWE Intern', status: 'NotAStatus' })
      .expect(400);

    expect(res.body.error).toMatch(/validation/i);
  });

  it('dedupes by company+role — returns 200 for existing, does not create duplicate', async () => {
    const { token } = await createUser();

    await authed('post', '/api/jobs', token)
      .send({ company: 'Google', role: 'SWE Intern', status: 'Applied' })
      .expect(201);

    await authed('post', '/api/jobs', token)
      .send({ company: 'Google', role: 'SWE Intern', status: 'Applied' })
      .expect(200);

    const count = await Job.countDocuments({ company: 'Google' });
    expect(count).toBe(1);
  });

  it('promotes status when incoming rank is higher than existing', async () => {
    const { token } = await createUser();

    await authed('post', '/api/jobs', token)
      .send({ company: 'Stripe', role: 'Backend Eng', status: 'Applied' })
      .expect(201);

    const res = await authed('post', '/api/jobs', token)
      .send({ company: 'Stripe', role: 'Backend Eng', status: 'Online Assessment' })
      .expect(200);

    expect(res.body.status).toBe('Online Assessment');
  });

  it('does not demote status when incoming rank is lower', async () => {
    const { token } = await createUser();

    await authed('post', '/api/jobs', token)
      .send({ company: 'Stripe', role: 'Backend Eng', status: 'Technical Interview' })
      .expect(201);

    const res = await authed('post', '/api/jobs', token)
      .send({ company: 'Stripe', role: 'Backend Eng', status: 'Applied' })
      .expect(200);

    expect(res.body.status).toBe('Technical Interview');
  });

  it('persists default status of Applied when status is omitted', async () => {
    const { token } = await createUser();
    const res = await authed('post', '/api/jobs', token)
      .send({ company: 'Apple', role: 'iOS Intern' })
      .expect(201);

    expect(res.body.status).toBe('Applied');
  });
});

// ── PUT /api/jobs/:id ─────────────────────────────────────────────────────────

describe('PUT /api/jobs/:id', () => {
  it('returns 401 without auth', async () => {
    const res = await request(app)
      .put('/api/jobs/000000000000000000000001')
      .set('Cookie', `csrf=${CSRF_TOKEN}`)
      .set('X-CSRF-Token', CSRF_TOKEN)
      .send({ status: 'Applied' });
    expect(res.status).toBe(401);
  });

  it('updates allowed fields and returns the updated job', async () => {
    const { user, token } = await createUser();
    const job = await Job.create({
      userId: user._id,
      company: 'Google',
      role: 'SWE Intern',
      status: 'Applied',
      normalizedCompany: 'google',
      normalizedRole: 'swe intern',
    });

    const res = await authed('put', `/api/jobs/${job._id}`, token)
      .send({ status: 'Online Assessment', notes: 'Passed screen' })
      .expect(200);

    expect(res.body.status).toBe('Online Assessment');
    expect(res.body.notes).toBe('Passed screen');
  });

  it('returns 400 for an invalid status value', async () => {
    const { user, token } = await createUser();
    const job = await Job.create({
      userId: user._id,
      company: 'Google',
      role: 'SWE Intern',
      status: 'Applied',
      normalizedCompany: 'google',
      normalizedRole: 'swe intern',
    });

    const res = await authed('put', `/api/jobs/${job._id}`, token)
      .send({ status: 'Dreaming' })
      .expect(400);

    expect(res.body.error).toMatch(/validation/i);
  });

  it('returns 400 for unknown fields (strict schema)', async () => {
    const { user, token } = await createUser();
    const job = await Job.create({
      userId: user._id,
      company: 'Google',
      role: 'SWE Intern',
      status: 'Applied',
      normalizedCompany: 'google',
      normalizedRole: 'swe intern',
    });

    const res = await authed('put', `/api/jobs/${job._id}`, token)
      .send({ unknownField: 'hacking' })
      .expect(400);

    expect(res.body.error).toMatch(/validation/i);
  });

  it("returns 404 when updating another user's job", async () => {
    const { user: u1 } = await createUser();
    const { token: t2 } = await createUser();

    const job = await Job.create({
      userId: u1._id,
      company: 'Google',
      role: 'SWE Intern',
      status: 'Applied',
      normalizedCompany: 'google',
      normalizedRole: 'swe intern',
    });

    const res = await authed('put', `/api/jobs/${job._id}`, t2)
      .send({ status: 'Online Assessment' })
      .expect(404);

    expect(res.body.message).toMatch(/not found/i);
  });
});

// ── DELETE /api/jobs/:id ──────────────────────────────────────────────────────

describe('DELETE /api/jobs/:id', () => {
  it('returns 401 without auth', async () => {
    const res = await request(app)
      .delete('/api/jobs/000000000000000000000001')
      .set('Cookie', `csrf=${CSRF_TOKEN}`)
      .set('X-CSRF-Token', CSRF_TOKEN);
    expect(res.status).toBe(401);
  });

  it('deletes the job and returns 204', async () => {
    const { user, token } = await createUser();
    const job = await Job.create({
      userId: user._id,
      company: 'Meta',
      role: 'PM Intern',
      status: 'Applied',
      normalizedCompany: 'meta',
      normalizedRole: 'pm intern',
    });

    await authed('delete', `/api/jobs/${job._id}`, token).expect(204);

    const found = await Job.findById(job._id);
    expect(found).toBeNull();
  });

  it("returns 404 when deleting another user's job", async () => {
    const { user: u1 } = await createUser();
    const { token: t2 } = await createUser();

    const job = await Job.create({
      userId: u1._id,
      company: 'Meta',
      role: 'PM Intern',
      status: 'Applied',
      normalizedCompany: 'meta',
      normalizedRole: 'pm intern',
    });

    const res = await authed('delete', `/api/jobs/${job._id}`, t2).expect(404);
    expect(res.body.message).toMatch(/not found/i);

    // Original record is untouched
    const still = await Job.findById(job._id);
    expect(still).not.toBeNull();
  });
});

// ── POST /api/jobs/bulk ───────────────────────────────────────────────────────

describe('POST /api/jobs/bulk', () => {
  it('returns 401 without auth', async () => {
    const res = await request(app)
      .post('/api/jobs/bulk')
      .set('Cookie', `csrf=${CSRF_TOKEN}`)
      .set('X-CSRF-Token', CSRF_TOKEN)
      .send({ jobs: [{ company: 'Google', role: 'SWE' }] });
    expect(res.status).toBe(401);
  });

  it('imports a batch of new jobs and returns created count', async () => {
    const { token } = await createUser();
    const jobs = [
      { company: 'Google', role: 'SWE Intern', status: 'Applied' },
      { company: 'Stripe', role: 'Backend Eng', status: 'Online Assessment' },
      { company: 'Apple', role: 'iOS Intern', status: 'Applied' },
    ];

    const res = await authed('post', '/api/jobs/bulk', token)
      .send({ jobs })
      .expect(200);

    expect(res.body.created).toBe(3);
    expect(res.body.updated).toBe(0);
    expect(res.body.skipped).toBe(0);
  });

  it('returns 400 when jobs array is empty', async () => {
    const { token } = await createUser();
    const res = await authed('post', '/api/jobs/bulk', token)
      .send({ jobs: [] })
      .expect(400);

    expect(res.body.error).toMatch(/validation/i);
  });

  it('returns 400 when jobs exceeds 200', async () => {
    const { token } = await createUser();
    const jobs = Array.from({ length: 201 }, (_, i) => ({
      company: `Company ${i}`,
      role: 'SWE',
      status: 'Applied',
    }));

    const res = await authed('post', '/api/jobs/bulk', token)
      .send({ jobs })
      .expect(400);

    expect(res.body.error).toMatch(/validation/i);
  });

  it('returns 400 when a job item has an oversized company field', async () => {
    const { token } = await createUser();
    const res = await authed('post', '/api/jobs/bulk', token)
      .send({ jobs: [{ company: 'G'.repeat(201), role: 'SWE' }] })
      .expect(400);

    expect(res.body.error).toMatch(/validation/i);
  });

  it('returns 400 when a job item has an invalid status', async () => {
    const { token } = await createUser();
    const res = await authed('post', '/api/jobs/bulk', token)
      .send({ jobs: [{ company: 'Google', role: 'SWE', status: 'Vibing' }] })
      .expect(400);

    expect(res.body.error).toMatch(/validation/i);
  });

  it('promotes status for existing jobs and skips when rank is equal or lower', async () => {
    const { token } = await createUser();

    // Seed one existing job at Applied
    await authed('post', '/api/jobs/bulk', token)
      .send({ jobs: [{ company: 'Meta', role: 'PM Intern', status: 'Applied' }] });

    const res = await authed('post', '/api/jobs/bulk', token)
      .send({
        jobs: [
          { company: 'Meta', role: 'PM Intern', status: 'Technical Interview' }, // promote
          { company: 'Meta', role: 'PM Intern', status: 'Applied' },             // skip (same)
        ],
      })
      .expect(200);

    // Only the first triggers an update; second is deduplicated by normalizedKey
    // and skipped since rank isn't higher than the now-promoted status
    const job = await Job.findOne({ normalizedCompany: 'meta' });
    expect(job.status).toBe('Technical Interview');
  });

  it('does not touch another user\'s jobs during bulk import', async () => {
    const { user: u1 } = await createUser();
    const { token: t2 } = await createUser();

    await Job.create({
      userId: u1._id,
      company: 'Google',
      role: 'SWE Intern',
      status: 'Technical Interview',
      normalizedCompany: 'google',
      normalizedRole: 'swe intern',
    });

    await authed('post', '/api/jobs/bulk', t2)
      .send({ jobs: [{ company: 'Google', role: 'SWE Intern', status: 'Accepted' }] });

    // u1's job must be untouched
    const u1Job = await Job.findOne({ userId: u1._id });
    expect(u1Job.status).toBe('Technical Interview');
  });
});

// ── DELETE /api/jobs/delete-all ───────────────────────────────────────────────

describe('DELETE /api/jobs/delete-all', () => {
  it('returns 401 without auth', async () => {
    const res = await request(app)
      .delete('/api/jobs/delete-all')
      .set('Cookie', `csrf=${CSRF_TOKEN}`)
      .set('X-CSRF-Token', CSRF_TOKEN)
      .send({ confirm: 'delete-all' });
    expect(res.status).toBe(401);
  });

  it('returns 400 without the confirm body', async () => {
    const { token } = await createUser();
    const res = await authed('delete', '/api/jobs/delete-all', token)
      .send({})
      .expect(400);

    expect(res.body.error).toMatch(/confirm/i);
  });

  it('returns 400 when confirm value is wrong', async () => {
    const { token } = await createUser();
    const res = await authed('delete', '/api/jobs/delete-all', token)
      .send({ confirm: 'yes please' })
      .expect(400);

    expect(res.body.error).toMatch(/confirm/i);
  });

  it('deletes all jobs for the user and returns the count', async () => {
    const { user, token } = await createUser();

    await Job.insertMany([
      { userId: user._id, company: 'Google', role: 'SWE', status: 'Applied', normalizedCompany: 'google', normalizedRole: 'swe' },
      { userId: user._id, company: 'Meta', role: 'PM', status: 'Applied', normalizedCompany: 'meta', normalizedRole: 'pm' },
    ]);

    const res = await authed('delete', '/api/jobs/delete-all', token)
      .send({ confirm: 'delete-all' })
      .expect(200);

    expect(res.body.deletedCount).toBe(2);
    expect(await Job.countDocuments({ userId: user._id })).toBe(0);
  });

  it("does not delete another user's jobs", async () => {
    const { user: u1 } = await createUser();
    const { token: t2 } = await createUser();

    await Job.create({
      userId: u1._id,
      company: 'Google',
      role: 'SWE',
      status: 'Applied',
      normalizedCompany: 'google',
      normalizedRole: 'swe',
    });

    await authed('delete', '/api/jobs/delete-all', t2)
      .send({ confirm: 'delete-all' })
      .expect(200);

    expect(await Job.countDocuments({ userId: u1._id })).toBe(1);
  });
});
