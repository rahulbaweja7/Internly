const { z } = require('zod');

const registerSchema = z.object({
  name:     z.string().min(1, 'Name is required').max(100).trim(),
  email:    z.string().email('Invalid email address').toLowerCase(),
  password: z.string().min(6, 'Password must be at least 6 characters').max(128),
});

const loginSchema = z.object({
  email:    z.string().email('Invalid email address').toLowerCase(),
  password: z.string().min(1, 'Password is required'),
});

const verifyEmailSchema = z.object({
  token: z.string().min(1, 'Token is required'),
});

const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address').toLowerCase(),
});

const resetPasswordSchema = z.object({
  token:    z.string().min(1, 'Token is required'),
  password: z.string().min(6, 'Password must be at least 6 characters').max(128),
});

const contactSchema = z.object({
  name:    z.string().max(100).trim().optional().default('Anonymous'),
  email:   z.string().email().optional().or(z.literal('')),
  message: z.string().min(5, 'Message must be at least 5 characters').max(2000),
});

module.exports = {
  registerSchema,
  loginSchema,
  verifyEmailSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  contactSchema,
};
