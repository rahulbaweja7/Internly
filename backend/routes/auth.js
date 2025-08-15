const express = require('express');
const passport = require('passport');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { isAuthenticated, isNotAuthenticated } = require('../middleware/auth');
const { authLimiter } = require('../middleware/security');
const { sendVerificationEmail, sendPasswordResetEmail } = require('../utils/emailService');
const { generateEmailVerificationToken, generatePasswordResetToken, hashToken, verifyToken } = require('../utils/tokenUtils');

const router = express.Router();
// Export user data (jobs + basic profile)
router.get('/export', async (req, res) => {
  try {
    // Allow token via Authorization or query ?token=...
    let user = req.user;
    if (!user) {
      const authHeader = req.headers.authorization;
      let token = null;
      if (authHeader && authHeader.startsWith('Bearer ')) token = authHeader.substring(7);
      if (!token && req.query.token) token = req.query.token;
      if (!token) return res.status(401).json({ error: 'Not authenticated' });
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
        user = await User.findById(decoded.id);
        if (!user || !user.isActive) return res.status(401).json({ error: 'Not authenticated' });
      } catch (e) {
        return res.status(401).json({ error: 'Invalid token' });
      }
    }

    const Job = require('../models/Job');
    const jobs = await Job.find({ userId: user._id }).lean();
    const data = {
      user: user.toPublicJSON(),
      jobs,
      exportedAt: new Date().toISOString(),
      version: 1,
    };
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', 'attachment; filename="internly-export.json"');
    res.send(JSON.stringify(data, null, 2));
  } catch (e) {
    console.error('Export error:', e);
    res.status(500).json({ error: 'Export failed' });
  }
});

// Delete account and data
router.delete('/delete', isAuthenticated, async (req, res) => {
  try {
    const Job = require('../models/Job');
    const GmailToken = require('../models/GmailToken');
    const User = require('../models/User');

    await Promise.all([
      Job.deleteMany({ userId: req.user._id }),
      GmailToken.deleteMany({ userId: req.user._id.toString() }),
    ]);
    await User.deleteOne({ _id: req.user._id });
    res.json({ success: true });
  } catch (e) {
    console.error('Delete account error:', e);
    res.status(500).json({ error: 'Delete failed' });
  }
});

// Google OAuth routes
router.get('/google', isNotAuthenticated, passport.authenticate('google', { 
  scope: ['profile', 'email'] 
}));

router.get('/google/callback', 
  passport.authenticate('google', { session: false, failureRedirect: '/login' }),
  (req, res) => {
    // Issue JWT and redirect with token in hash fragment
    const token = generateToken(req.user);
    const rawUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const frontendUrl = rawUrl.replace(/\/$/, ''); // strip trailing slash
    res.redirect(`${frontendUrl}/dashboard#token=${token}`);
  }
);

// Generate JWT token
const generateToken = (user) => {
  return jwt.sign(
    { 
      id: user._id, 
      email: user.email,
      isEmailVerified: user.isEmailVerified 
    },
    process.env.JWT_SECRET || 'your-secret-key',
    { expiresIn: '7d' }
  );
};

// Register new user
router.post('/register', authLimiter, isNotAuthenticated, async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Validation
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    // Basic email format validation to prevent obvious bad emails
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long' });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'User with this email already exists' });
    }

    // Generate verification token
    const verificationToken = generateEmailVerificationToken();
    const hashedToken = hashToken(verificationToken);

    // Create new user
    const user = new User({
      name,
      email,
      password,
      emailVerificationToken: hashedToken,
      emailVerificationExpires: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
    });

    await user.save();

    // Send verification email (skip during automated tests)
    if (process.env.NODE_ENV !== 'test') {
      await sendVerificationEmail(email, name, verificationToken);
    }

    // Generate JWT token
    const token = generateToken(user);

    res.status(201).json({
      message: 'User registered successfully. Please check your email to verify your account.',
      token,
      user: user.toPublicJSON()
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// Login user
router.post('/login', authLimiter, isNotAuthenticated, async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(401).json({ error: 'Account is deactivated' });
    }

    // Check password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Generate JWT token
    const token = generateToken(user);

    res.json({
      message: 'Login successful',
      token,
      user: user.toPublicJSON()
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Verify email
router.post('/verify-email', async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ error: 'Verification token is required' });
    }

    const hashedToken = hashToken(token);
    const user = await User.findOne({
      emailVerificationToken: hashedToken,
      emailVerificationExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ error: 'Invalid or expired verification token' });
    }

    // Mark email as verified
    user.isEmailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpires = undefined;
    await user.save();

    res.json({ message: 'Email verified successfully' });

  } catch (error) {
    console.error('Email verification error:', error);
    res.status(500).json({ error: 'Email verification failed' });
  }
});

// Request password reset
router.post('/forgot-password', authLimiter, async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      // Don't reveal if user exists or not
      return res.json({ message: 'If an account with that email exists, a password reset link has been sent.' });
    }

    // Generate reset token
    const resetToken = generatePasswordResetToken();
    const hashedToken = hashToken(resetToken);

    user.passwordResetToken = hashedToken;
    user.passwordResetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    await user.save();

    // Send reset email
    await sendPasswordResetEmail(email, user.name, resetToken);

    res.json({ message: 'If an account with that email exists, a password reset link has been sent.' });

  } catch (error) {
    console.error('Password reset request error:', error);
    res.status(500).json({ error: 'Password reset request failed' });
  }
});

// Reset password
router.post('/reset-password', authLimiter, async (req, res) => {
  try {
    const { token, password } = req.body;

    if (!token || !password) {
      return res.status(400).json({ error: 'Token and new password are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long' });
    }

    const hashedToken = hashToken(token);
    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ error: 'Invalid or expired reset token' });
    }

    // Update password
    user.password = password;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    res.json({ message: 'Password reset successfully' });

  } catch (error) {
    console.error('Password reset error:', error);
    res.status(500).json({ error: 'Password reset failed' });
  }
});

// Get current user
router.get('/me', isAuthenticated, (req, res) => {
  res.json({
    user: req.user.toPublicJSON()
  });
});

// Update current user's profile (name/picture)
router.put('/me', isAuthenticated, async (req, res) => {
  try {
    const { name, picture } = req.body || {};

    if (typeof name === 'string') {
      req.user.name = name.trim().slice(0, 64);
    }

    if (typeof picture === 'string') {
      // Accept HTTPS URLs or small data URLs (image/*)
      const isHttpsUrl = /^https:\/\//i.test(picture);
      const isDataUrl = /^data:image\/(png|jpeg|jpg|webp);base64,/i.test(picture);
      if (isHttpsUrl || isDataUrl) {
        // Basic size guard for data URLs (~< 500KB)
        if (isDataUrl && picture.length > 700000) {
          return res.status(400).json({ error: 'Avatar is too large' });
        }
        req.user.picture = picture;
      }
    }

    await req.user.save();
    return res.json({ user: req.user.toPublicJSON() });
  } catch (e) {
    console.error('Update /me error:', e);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// Logout (JWT: client-side token removal)
router.get('/logout', (req, res) => {
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
  res.redirect(`${frontendUrl}/`);
});

module.exports = router; 