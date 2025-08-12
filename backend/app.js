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
    const job = new Job({
      ...req.body,
      userId: req.user._id,
    });
    await job.save();
    res.status(201).json(job);
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


