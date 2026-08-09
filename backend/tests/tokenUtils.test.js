const {
  generateToken,
  generateEmailVerificationToken,
  generatePasswordResetToken,
  hashToken,
  verifyToken,
} = require('../utils/tokenUtils');

const HEX = /^[0-9a-f]+$/;

describe('tokenUtils', () => {
  describe('generateToken', () => {
    it('defaults to 32 bytes (64 hex chars)', () => {
      const token = generateToken();
      expect(token).toMatch(HEX);
      expect(token).toHaveLength(64);
    });

    it('honors a custom byte length', () => {
      expect(generateToken(16)).toHaveLength(32);
      expect(generateToken(48)).toHaveLength(96);
    });

    it('produces a different value on each call', () => {
      const a = generateToken();
      const b = generateToken();
      expect(a).not.toBe(b);
    });
  });

  describe('generateEmailVerificationToken / generatePasswordResetToken', () => {
    it('return 32-byte hex tokens', () => {
      const verify = generateEmailVerificationToken();
      const reset = generatePasswordResetToken();
      expect(verify).toMatch(HEX);
      expect(verify).toHaveLength(64);
      expect(reset).toMatch(HEX);
      expect(reset).toHaveLength(64);
      expect(verify).not.toBe(reset);
    });
  });

  describe('hashToken', () => {
    it('returns a sha256 hex digest (64 chars)', () => {
      const hash = hashToken('some-token');
      expect(hash).toMatch(HEX);
      expect(hash).toHaveLength(64);
    });

    it('is deterministic for the same input', () => {
      expect(hashToken('abc')).toBe(hashToken('abc'));
    });

    it('differs for different inputs', () => {
      expect(hashToken('abc')).not.toBe(hashToken('abd'));
    });
  });

  describe('verifyToken', () => {
    it('accepts a token that matches its own hash', () => {
      const token = generateToken();
      const stored = hashToken(token);
      expect(verifyToken(token, stored)).toBe(true);
    });

    it('rejects a token whose hash does not match', () => {
      const stored = hashToken(generateToken());
      expect(verifyToken('wrong-token', stored)).toBe(false);
    });
  });
});
