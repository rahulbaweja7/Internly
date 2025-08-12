const express = require('express');
const session = require('express-session');
const passport = require('passport');
const { setupSecurity } = require('./middleware/security');
const { notFound, errorHandler } = require('./middleware/errorHandler');

const app = express();

// Trust proxy in production (for correct secure cookies behind proxies)
if (process.env.NODE_ENV === 'production') {
  app.set('trust proxy', 1);
}

// Observability removed (Sentry disabled)

// Security and basic middleware
setupSecurity(app);
app.use(express.json());

// Session configuration
app.use(session({
  secret: process.env.SESSION_SECRET || 'your-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'lax' : 'lax',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000,
  },
}));

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
  callbackURL: '/api/auth/google/callback',
}, async (accessToken, refreshToken, profile, done) => {
  try {
    let user = await User.findOne({ googleId: profile.id });
    if (user) return done(null, user);

    user = new User({
      googleId: profile.id,
      email: profile.emails[0].value,
      name: profile.displayName,
      picture: profile.photos[0]?.value,
    });
    await user.save();
    return done(null, user);
  } catch (error) {
    return done(error, null);
  }
}));

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
app.use('/', gmailRoutes); // OAuth callback root-level route

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
    const { company, role, status, dateApplied, notes, emailId, subject, location, stipend } = req.body;

    const normalize = (v) => (v || '').toString().toLowerCase().replace(/&/g, ' and ').replace(/[^a-z0-9]+/g, ' ').trim().replace(/\s+/g, ' ');
    const normalizedCompany = normalize(company);
    const normalizedRole = normalize(role);

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
      if (!job.emailId) job.emailId = emailId;
      job.statusHistory.push({ status: status || job.status, at: new Date(), source: 'gmail', emailId, subject });
      updated = true;
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
    const job = await Job.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      req.body,
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


