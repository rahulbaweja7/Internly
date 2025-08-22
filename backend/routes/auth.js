const express = require('express');
const passport = require('passport');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { isAuthenticated, isNotAuthenticated } = require('../middleware/auth');
const { authLimiter } = require('../middleware/security');
const { sendVerificationEmail, sendPasswordResetEmail } = require('../utils/emailService');
const { generateEmailVerificationToken, generatePasswordResetToken, hashToken, verifyToken } = require('../utils/tokenUtils');
const { createTransport } = require('nodemailer');

const router = express.Router();
// Export user data (jobs + basic profile) – authenticated via cookie or Authorization header
router.get('/export', isAuthenticated, async (req, res) => {
  try {
    const Job = require('../models/Job');
    const jobs = await Job.find({ userId: req.user._id }).lean();
    const data = {
      user: req.user.toPublicJSON(),
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
    const User = require('../models/User');

    const ProcessedEmail = require('../models/ProcessedEmail');
    const GmailToken = require('../models/GmailToken');
    await Promise.all([
      Job.deleteMany({ userId: req.user._id }),
      ProcessedEmail.deleteMany({ userId: req.user._id }).catch(() => {}),
      GmailToken.deleteMany({ userId: req.user._id }).catch(() => {}),
    ]);
    await User.deleteOne({ _id: req.user._id });
    // Also clear auth cookies just like /logout so the browser session is gone
    const isProd = process.env.NODE_ENV === 'production';
    const domainConfigured = process.env.COOKIE_DOMAIN || '';
    const baseAttrs = ['Path=/', 'HttpOnly', isProd ? 'Secure' : '', 'SameSite=Lax', 'Max-Age=0'].filter(Boolean);
    const cookiesToSet = [];
    cookiesToSet.push(['token=;', ...baseAttrs].join('; '));
    if (domainConfigured) {
      cookiesToSet.push(['token=;', `Domain=${domainConfigured}`, ...baseAttrs].join('; '));
    }
    const csrfBase = ['Path=/', isProd ? 'Secure' : '', 'SameSite=Lax', 'Max-Age=0'].filter(Boolean);
    cookiesToSet.push(['csrf=;', ...csrfBase].join('; '));
    if (domainConfigured) {
      cookiesToSet.push(['csrf=;', `Domain=${domainConfigured}`, ...csrfBase].join('; '));
    }
    res.setHeader('Set-Cookie', cookiesToSet);
    res.json({ success: true });
  } catch (e) {
    console.error('Delete account error:', e);
    res.status(500).json({ error: 'Delete failed' });
  }
});

// Google OAuth routes
router.get(
  '/google',
  isNotAuthenticated,
  passport.authenticate('google', {
    scope: ['profile', 'email'],
    prompt: 'select_account',
  })
);

router.get('/google/callback', 
  passport.authenticate('google', { session: false, failureRedirect: (process.env.FRONTEND_URL || 'http://localhost:3000') + '/login?oauth=failed' }),
  (req, res) => {
    // Issue JWT in HttpOnly, Secure, SameSite=Lax cookie; no token in URL
    const token = generateToken(req.user);
    const isProd = process.env.NODE_ENV === 'production';
    const domainPart = process.env.COOKIE_DOMAIN ? `Domain=${process.env.COOKIE_DOMAIN}` : '';
    const cookieParts = [
      `token=${encodeURIComponent(token)}`,
      `Path=/`,
      domainPart,
      `HttpOnly`,
      isProd ? `Secure` : '',
      `SameSite=Lax`,
      `Max-Age=${7 * 24 * 60 * 60}`,
    ].filter(Boolean);
    res.setHeader('Set-Cookie', cookieParts.join('; '));
    const rawUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const frontendUrl = rawUrl.replace(/\/$/, ''); // strip trailing slash
    res.redirect(`${frontendUrl}/dashboard`);
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

    // Set JWT cookie
    const token = generateToken(user);
    const isProd = process.env.NODE_ENV === 'production';
    const domainPart = process.env.COOKIE_DOMAIN ? `Domain=${process.env.COOKIE_DOMAIN}` : '';
    const cookieParts = [
      `token=${encodeURIComponent(token)}`,
      `Path=/`,
      domainPart,
      `HttpOnly`,
      isProd ? `Secure` : '',
      `SameSite=Lax`,
      `Max-Age=${7 * 24 * 60 * 60}`,
    ].filter(Boolean);
    res.setHeader('Set-Cookie', cookieParts.join('; '));

    res.status(201).json({
      message: 'User registered successfully. Please check your email to verify your account.',
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

    // Set JWT cookie
    const token = generateToken(user);
    const isProd = process.env.NODE_ENV === 'production';
    const cookieParts = [
      `token=${encodeURIComponent(token)}`,
      `Path=/`,
      `HttpOnly`,
      isProd ? `Secure` : '',
      `SameSite=Lax`,
      `Max-Age=${7 * 24 * 60 * 60}`,
    ].filter(Boolean);
    res.setHeader('Set-Cookie', cookieParts.join('; '));

    res.json({
      message: 'Login successful',
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

// Quick user counts (protected)
router.get('/stats/users', isAuthenticated, async (req, res) => {
  try {
    const total = await User.estimatedDocumentCount();
    const since = (days) => new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const last24h = await User.countDocuments({ createdAt: { $gte: since(1) } });
    const last7d = await User.countDocuments({ createdAt: { $gte: since(7) } });
    res.json({ total, last24h, last7d });
  } catch (e) {
    console.error('User stats error:', e);
    res.status(500).json({ error: 'Failed to fetch user stats' });
  }
});

// Update current user's profile (name/picture)
router.put('/me', isAuthenticated, async (req, res) => {
  try {
    const { name, picture, location, bio } = req.body || {};

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

    if (typeof location === 'string') {
      req.user.location = location.trim().slice(0, 120);
    }
    if (typeof bio === 'string') {
      req.user.bio = bio.trim().slice(0, 600);
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
  // Clear auth cookies for both host-only and domain-wide scopes
  const isProd = process.env.NODE_ENV === 'production';
  const domainConfigured = process.env.COOKIE_DOMAIN || '';

  const baseAttrs = ['Path=/', 'HttpOnly', isProd ? 'Secure' : '', 'SameSite=Lax', 'Max-Age=0'].filter(Boolean);

  const cookiesToSet = [];
  // 1) Host-only cookie (no Domain attr): clears tokens set without Domain or with host-only scope
  cookiesToSet.push(['token=;', ...baseAttrs].join('; '));
  // 2) Domain-wide cookie (Domain=.applycation.net) if configured
  if (domainConfigured) {
    cookiesToSet.push(['token=;', `Domain=${domainConfigured}`, ...baseAttrs].join('; '));
  }
  // Optionally clear CSRF cookie as well so the client starts fresh
  const csrfBase = ['Path=/', isProd ? 'Secure' : '', 'SameSite=Lax', 'Max-Age=0'].filter(Boolean);
  cookiesToSet.push(['csrf=;', ...csrfBase].join('; '));
  if (domainConfigured) {
    cookiesToSet.push(['csrf=;', `Domain=${domainConfigured}`, ...csrfBase].join('; '));
  }

  res.setHeader('Set-Cookie', cookiesToSet);
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
  res.redirect(`${frontendUrl}/`);
});

// Set or change password for the current user
// - If the user already has a password, currentPassword is required and must match
// - If the account was created via Google (no password yet), currentPassword is optional
router.put('/password', isAuthenticated, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body || {};

    if (!newPassword || typeof newPassword !== 'string' || newPassword.length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters' });
    }

    const user = req.user;

    // If a password exists, verify current password
    if (user.password) {
      const matches = await user.comparePassword(currentPassword || '');
      if (!matches) {
        return res.status(400).json({ error: 'Current password is incorrect' });
      }
    }

    user.password = newPassword;
    await user.save();
    return res.json({ success: true });
  } catch (e) {
    console.error('Update password error:', e);
    res.status(500).json({ error: 'Failed to update password' });
  }
});

// Lightweight contact endpoint – sends message to a fixed inbox
router.post('/contact', async (req, res) => {
  try {
    const { name = 'Anonymous', email = '', message = '' } = req.body || {};
    if (!message || message.trim().length < 5) {
      return res.status(400).json({ error: 'Message is too short' });
    }

    const to = process.env.CONTACT_TO || 'rahulbaweja2004@gmail.com';
    const subject = `Applycation contact form: ${name}`;
    const text = `From: ${name}${email ? ` <${email}>` : ''}\n\n${message}`;

    // Prefer Resend HTTP API if configured (no dependency on global fetch)
    if (process.env.RESEND_API_KEY) {
      const from = process.env.RESEND_FROM || 'onboarding@resend.dev';
      const payload = JSON.stringify({ from, to, subject, text, reply_to: email || undefined });
      const https = require('node:https');
      const options = {
        hostname: 'api.resend.com',
        path: '/emails',
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(payload),
        },
      };
      const result = await new Promise((resolve, reject) => {
        const req2 = https.request(options, (resp) => {
          let data = '';
          resp.on('data', (d) => (data += d));
          resp.on('end', () => {
            if (resp.statusCode && resp.statusCode >= 200 && resp.statusCode < 300) {
              resolve({ ok: true, status: resp.statusCode, body: data });
            } else {
              console.error('Resend error:', resp.statusCode, data);
              resolve({ ok: false, status: resp.statusCode, body: data });
            }
          });
        });
        req2.on('error', reject);
        req2.write(payload);
        req2.end();
      });
      if (!result.ok) return res.status(500).json({ error: 'Failed to send message' });
      return res.json({ success: true });
    }

    // Fallback to SMTP (Gmail or other)
    if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
      const transporter = require('nodemailer').createTransport({
        service: 'gmail',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
      });
      await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to,
        subject,
        text,
        replyTo: email || undefined,
      });
      return res.json({ success: true });
    }

    console.error('No email transport configured. Set RESEND_API_KEY (preferred) or EMAIL_USER/EMAIL_PASS.');
    return res.status(500).json({ error: 'Email service not configured' });
  } catch (e) {
    console.error('Contact form error:', e);
    return res.status(500).json({ error: 'Failed to send message' });
  }
});

module.exports = router; 