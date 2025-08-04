const express = require('express');
const passport = require('passport');
const User = require('../models/User');
const { isAuthenticated, isNotAuthenticated } = require('../middleware/auth');

const router = express.Router();

// Google OAuth routes
router.get('/google', isNotAuthenticated, passport.authenticate('google', { 
  scope: ['profile', 'email'] 
}));

router.get('/google/callback', 
  passport.authenticate('google', { failureRedirect: '/login' }),
  (req, res) => {
    // Successful authentication, redirect to frontend
    res.redirect('http://localhost:3000/dashboard');
  }
);

// Get current user
router.get('/me', isAuthenticated, (req, res) => {
  res.json({
    user: {
      id: req.user._id,
      googleId: req.user.googleId,
      email: req.user.email,
      name: req.user.name,
      picture: req.user.picture
    }
  });
});

// Logout
router.get('/logout', (req, res) => {
  req.logout((err) => {
    if (err) {
      return res.status(500).json({ error: 'Error during logout' });
    }
    res.redirect('http://localhost:3000/');
  });
});

module.exports = router; 