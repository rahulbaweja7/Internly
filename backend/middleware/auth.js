const jwt = require('jsonwebtoken');
const User = require('../models/User');

const isAuthenticated = async (req, res, next) => {
  try {
    // Check for JWT token in Authorization header
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
        const user = await User.findById(decoded.id);
        
        if (user && user.isActive) {
          req.user = user;
          return next();
        }
      } catch (jwtError) {
        // JWT verification failed, continue to session check
      }
    }
    
    // Fallback to session-based authentication (for Google OAuth)
    if (req.isAuthenticated()) {
      return next();
    }
    
    res.status(401).json({ error: 'Not authenticated' });
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(500).json({ error: 'Authentication failed' });
  }
};

const isNotAuthenticated = (req, res, next) => {
  if (!req.isAuthenticated()) {
    return next();
  }
  res.status(400).json({ error: 'Already authenticated' });
};

module.exports = { isAuthenticated, isNotAuthenticated }; 