const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const cors = require('cors');

// Rate limiting middleware
const createRateLimiter = (windowMs, max, message) => {
  // Disable rate limiting entirely in development or when explicitly disabled
  if (process.env.NODE_ENV === 'development' || process.env.RATE_LIMIT_DISABLED === 'true') {
    return (req, res, next) => next();
  }
  return rateLimit({
    windowMs: windowMs || 15 * 60 * 1000, // 15 minutes default
    max: max || 100, // limit each IP to 100 requests per windowMs
    message: message || 'Too many requests from this IP, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
  });
};

// General API rate limiter
const apiLimiter = createRateLimiter(
  parseInt(process.env.API_RATE_LIMIT_WINDOW_MS, 10) || 15 * 60 * 1000,
  parseInt(process.env.API_RATE_LIMIT_MAX_REQUESTS, 10) || 300
);

// Stricter rate limiter for auth routes (configurable via env)
const authLimiter = createRateLimiter(
  parseInt(process.env.AUTH_RATE_LIMIT_WINDOW_MS, 10) || 15 * 60 * 1000, // default 15 minutes
  parseInt(process.env.AUTH_RATE_LIMIT_MAX_REQUESTS, 10) || 5, // default 5 requests
  process.env.AUTH_RATE_LIMIT_MESSAGE || 'Too many authentication attempts, please try again later.'
);

// Gmail API rate limiter (re-enabled)
const gmailLimiter = createRateLimiter(
  parseInt(process.env.GMAIL_RATE_LIMIT_WINDOW_MS, 10) || 60 * 1000,
  parseInt(process.env.GMAIL_RATE_LIMIT_MAX_REQUESTS, 10) || 60,
  process.env.GMAIL_RATE_LIMIT_MESSAGE || 'Too many Gmail API requests, please try again later.'
);

// CORS configuration
const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = process.env.ALLOWED_ORIGINS 
      ? process.env.ALLOWED_ORIGINS.split(',') 
      : [(process.env.FRONTEND_URL || 'http://localhost:3000')];
    
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200
};

// Helmet configuration
const helmetConfig = {
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:"],
      scriptSrc: ["'self'"],
      connectSrc: ["'self'", "https://accounts.google.com", "https://www.googleapis.com"],
    },
  },
  crossOriginEmbedderPolicy: false,
};

// Security middleware setup
const setupSecurity = (app) => {
  // Basic security headers
  if (process.env.HELMET_ENABLED !== 'false') {
    app.use(helmet(helmetConfig));
  }

  // CORS
  app.use(cors(corsOptions));

  // Rate limiting
  app.use('/api/', apiLimiter);
  // Auth limiter is applied selectively per-route in auth router to avoid throttling /me, /logout
  app.use('/api/gmail/', gmailLimiter);

  // Additional security headers
  app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    next();
  });
};

module.exports = {
  setupSecurity,
  apiLimiter,
  authLimiter,
  gmailLimiter,
  corsOptions
};
