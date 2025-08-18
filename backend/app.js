const express = require('express');
const session = require('express-session');
const RedisStoreLib = require('connect-redis').default;
const { Redis } = require('ioredis');
const passport = require('passport');
const { setupSecurity } = require('./middleware/security');
const { notFound, errorHandler } = require('./middleware/errorHandler');
const crypto = require('crypto');

const app = express();

// Trust proxy in production (for correct secure cookies behind proxies)
if (process.env.NODE_ENV === 'production') {
  app.set('trust proxy', 1);
}

// Observability removed (Sentry disabled)

// Security and basic middleware
setupSecurity(app);
app.use(express.json());

// Session configuration (kept for passport compatibility); no auth data stored here
(() => {
  const base = {
    secret: process.env.SESSION_SECRET || 'your-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'lax' : 'lax',
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000,
    },
  };
  if (process.env.REDIS_URL) {
    const client = new Redis(process.env.REDIS_URL);
    const RedisStore = RedisStoreLib;
    app.use(session({
      ...base,
      store: new RedisStore({ client, prefix: 'sess:' }),
    }));
  } else {
    app.use(session(base));
  }
})();

// Initialize Passport
app.use(passport.initialize());
app.use(passport.session());

// Models
const Job = require('./models/Job');
const User = require('./models/User');

// Passport configuration (Google OAuth)
passport.use(new (require('passport-google-oauth20').Strategy)({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: process.env.GOOGLE_AUTH_CALLBACK_URL || `${process.env.BACKEND_URL || 'http://localhost:3001'}/api/auth/google/callback`,
}, async (accessToken, refreshToken, profile, done) => {
  try {
    const email = (profile.emails && profile.emails[0] && profile.emails[0].value || '').toLowerCase();

    // 1) Prefer existing link by googleId
    let user = await User.findOne({ googleId: profile.id });
    if (user) return done(null, user);

    // 2) Link to existing account with same email (user registered with email/password earlier)
    if (email) {
      const existingByEmail = await User.findOne({ email });
      if (existingByEmail) {
        existingByEmail.googleId = profile.id;
        if (!existingByEmail.picture && profile.photos && profile.photos[0] && profile.photos[0].value) {
          existingByEmail.picture = profile.photos[0].value;
        }
        if (!existingByEmail.name && profile.displayName) {
          existingByEmail.name = profile.displayName;
        }
        // Consider email verified when coming from Google
        existingByEmail.isEmailVerified = true;
        await existingByEmail.save();
        return done(null, existingByEmail);
      }
    }

    // 3) Single atomic upsert by either googleId or email
    const upsertEmail = email || `user-${profile.id}@google.local`;
    const pictureUrl = (profile.photos && profile.photos[0] && profile.photos[0].value) || undefined;
    const filter = email
      ? { $or: [{ googleId: profile.id }, { email: upsertEmail }] }
      : { googleId: profile.id };
    try {
      const doc = await User.findOneAndUpdate(
        filter,
        {
          $setOnInsert: {
            email: upsertEmail,
            name: profile.displayName || 'User',
            createdAt: new Date(),
            isActive: true,
          },
          $set: {
            googleId: profile.id,
            isEmailVerified: true,
            ...(pictureUrl ? { picture: pictureUrl } : {}),
          },
        },
        { new: true, upsert: true }
      );
      return done(null, doc);
    } catch (e) {
      // If duplicate by email raced, link explicitly by email
      const isDup = e && (e.code === 11000 || /E11000/.test(String(e && e.message)));
      if (isDup && email) {
        const doc = await User.findOneAndUpdate(
          { email: upsertEmail },
          {
            $set: {
              googleId: profile.id,
              isEmailVerified: true,
              ...(pictureUrl ? { picture: pictureUrl } : {}),
            },
          },
          { new: true }
        );
        if (doc) return done(null, doc);
      }
      return done(e, null);
    }
  } catch (error) {
    return done(error, null);
  }
}));

// Log which OAuth client and callback URL are configured (for diagnosing redirect_uri_mismatch)
try {
  const cbUrl = process.env.GOOGLE_AUTH_CALLBACK_URL || `${process.env.BACKEND_URL || 'http://localhost:3001'}/api/auth/google/callback`;
  const cid = process.env.GOOGLE_CLIENT_ID || '';
  const cidSuffix = cid.length > 8 ? cid.slice(-8) : cid;
  // eslint-disable-next-line no-console
  console.log('[OAUTH] Google client ID (suffix) =', cidSuffix, 'callbackURL =', cbUrl);
} catch (_) {}

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

// Routes
const authRoutes = require('./routes/auth');
const gmailRoutes = require('./routes/gmail');
const { isAuthenticated } = require('./middleware/auth');

app.use('/api/auth', authRoutes);
app.use('/api/gmail', gmailRoutes);

// Lightweight CSRF protection (double-submit cookie):
// - Server issues a non-HttpOnly `csrf` cookie with a random token
// - Client mirrors it in `X-CSRF-Token` header for state-changing requests
const CSRF_COOKIE_NAME = 'csrf';
const regenerateCsrfIfMissing = (req, res, next) => {
  const cookieHeader = req.headers.cookie || '';
  const parts = cookieHeader.split(';').map((p) => p.trim());
  const csrfPart = parts.find((p) => p.startsWith(`${CSRF_COOKIE_NAME}=`));
  if (!csrfPart) {
    const token = crypto.randomBytes(24).toString('hex');
    const isProd = process.env.NODE_ENV === 'production';
    const domainPart = process.env.COOKIE_DOMAIN ? `Domain=${process.env.COOKIE_DOMAIN}` : '';
    const cookieParts = [
      `${CSRF_COOKIE_NAME}=${encodeURIComponent(token)}`,
      'Path=/',
      domainPart,
      // Not HttpOnly so client can read and echo in header
      isProd ? 'Secure' : '',
      'SameSite=Lax',
      'Max-Age=1209600', // 14 days
    ].filter(Boolean);
    res.setHeader('Set-Cookie', [...(res.getHeader('Set-Cookie') || []), cookieParts.join('; ')]);
  }
  next();
};

const verifyCsrf = (req, res, next) => {
  // Skip safe methods
  const method = (req.method || 'GET').toUpperCase();
  if (method === 'GET' || method === 'HEAD' || method === 'OPTIONS') return next();

  const cookieHeader = req.headers.cookie || '';
  const parts = cookieHeader.split(';').map((p) => p.trim());
  const csrfPart = parts.find((p) => p.startsWith(`${CSRF_COOKIE_NAME}=`));
  const cookieToken = csrfPart ? decodeURIComponent(csrfPart.split('=').slice(1).join('=')) : '';
  const headerToken = req.get('X-CSRF-Token') || req.get('x-csrf-token') || '';
  if (!cookieToken || !headerToken || cookieToken !== headerToken) {
    return res.status(403).json({ error: 'CSRF validation failed' });
  }
  return next();
};

app.use(regenerateCsrfIfMissing);
app.use(verifyCsrf);

// Health check
app.get('/healthz', (req, res) => {
  res.json({ ok: true, service: 'internly-api', time: new Date().toISOString() });
});

// Status precedence for auto-promotion
const statusRank = {
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

// Protected job routes
app.get('/api/jobs', isAuthenticated, async (req, res) => {
  try {
    const jobs = await Job.find({ userId: req.user._id });
    res.json(jobs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.post('/api/jobs', isAuthenticated, async (req, res) => {
  try {
    const { company, role, status, dateApplied, notes, emailId, subject, location, stipend } = req.body || {};

    const normalize = (v) => (v || '').toString().toLowerCase().replace(/&/g, ' and ').replace(/[^a-z0-9]+/g, ' ').trim().replace(/\s+/g, ' ');
    const normalizedCompany = normalize(company);
    const normalizedRole = normalize(role)
      .replace(/software\s+engineer/gi, 'swe')
      .replace(/full\s*stack/gi, 'fullstack')
      .replace(/internship/gi, 'intern')
      .trim();

    // Find existing job for same user + company + role
    let job = await Job.findOne({ userId: req.user._id, normalizedCompany, normalizedRole });

    if (!job) {
      job = new Job({
        userId: req.user._id,
        company,
        role,
        location,
        status: status || 'Applied',
        stipend,
        dateApplied,
        notes,
        emailId,
        statusHistory: [
          { status: status || 'Applied', at: new Date(dateApplied || Date.now()), source: 'gmail', emailId, subject },
        ],
      });
      await job.save();
      return res.status(201).json(job);
    }

    // Merge into existing: promote status by precedence
    const currentRank = statusRank[job.status] || 0;
    const incomingRank = statusRank[status] || 0;
    let updated = false;
    if (incomingRank > currentRank) {
      job.status = status;
      updated = true;
    }
    if (location && !job.location) { job.location = location; updated = true; }
    if (stipend && !job.stipend) { job.stipend = stipend; updated = true; }
    if (dateApplied && (!job.dateApplied || new Date(dateApplied) < job.dateApplied)) {
      job.dateApplied = dateApplied; // keep earliest application date
      updated = true;
    }
    if (notes) { job.notes = job.notes ? `${job.notes}\n${notes}` : notes; updated = true; }

    const hasEmailInHistory = emailId && (job.emailId === emailId || (job.statusHistory || []).some(h => h.emailId === emailId));
    if (emailId && !hasEmailInHistory) {
      if (!job.emailId) { job.emailId = emailId; updated = true; }
      // Only record a history entry if status meaningfully changed
      const willChangeStatus = (incomingRank > currentRank) || (status && status !== job.status);
      if (willChangeStatus) {
        job.statusHistory.push({ status: status || job.status, at: new Date(), source: 'gmail', emailId, subject });
        updated = true;
      }
    } else if (incomingRank > currentRank) {
      // Record status change without duplicating emailId
      job.statusHistory.push({ status: status, at: new Date(), source: 'gmail', subject });
      updated = true;
    }

    if (!updated) {
      return res.status(200).json(job);
    }

    await job.save();
    res.status(200).json(job);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

app.put('/api/jobs/:id', isAuthenticated, async (req, res) => {
  try {
    // Whitelist updatable fields
    const { company, role, status, dateApplied, notes, location, stipend } = req.body || {};
    const update = {};
    if (typeof company === 'string') update.company = company;
    if (typeof role === 'string') update.role = role;
    if (typeof status === 'string') update.status = status;
    if (location !== undefined) update.location = location;
    if (stipend !== undefined) update.stipend = stipend;
    if (dateApplied !== undefined) update.dateApplied = dateApplied;
    if (typeof notes === 'string') update.notes = notes;

    const job = await Job.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      update,
      { new: true },
    );
    if (!job) return res.status(404).json({ message: 'Job not found' });
    res.json(job);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

app.delete('/api/jobs/:id', isAuthenticated, async (req, res) => {
  try {
    const job = await Job.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
    if (!job) return res.status(404).json({ message: 'Job not found' });
    res.sendStatus(204);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete all jobs for a user
app.delete('/api/jobs/delete-all', isAuthenticated, async (req, res) => {
  try {
    const result = await Job.deleteMany({ userId: req.user._id });
    res.json({
      message: `Successfully deleted ${result.deletedCount} internship${result.deletedCount !== 1 ? 's' : ''}`,
      deletedCount: result.deletedCount,
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete all internships' });
  }
});

// 404 and error handlers
app.use(notFound);
app.use(errorHandler);

module.exports = app;


