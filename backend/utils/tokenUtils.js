const crypto = require('crypto');

// Generate a random token
const generateToken = (length = 32) => {
  return crypto.randomBytes(length).toString('hex');
};

// Generate email verification token
const generateEmailVerificationToken = () => {
  return generateToken(32);
};

// Generate password reset token
const generatePasswordResetToken = () => {
  return generateToken(32);
};

// Hash token for storage (more secure)
const hashToken = (token) => {
  return crypto.createHash('sha256').update(token).digest('hex');
};

// Verify token by comparing hashes
const verifyToken = (token, hashedToken) => {
  const hashedInput = hashToken(token);
  return hashedInput === hashedToken;
};

module.exports = {
  generateToken,
  generateEmailVerificationToken,
  generatePasswordResetToken,
  hashToken,
  verifyToken
};
