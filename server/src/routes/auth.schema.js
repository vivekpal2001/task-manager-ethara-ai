const { z } = require('zod');

const signupSchema = z.object({
  name: z
    .string({ required_error: 'Name is required' })
    .min(2, 'Name must be at least 2 characters')
    .max(50, 'Name must be at most 50 characters')
    .trim(),
  email: z
    .string({ required_error: 'Email is required' })
    .email('Please provide a valid email')
    .toLowerCase()
    .trim(),
  password: z
    .string({ required_error: 'Password is required' })
    .min(6, 'Password must be at least 6 characters')
    .max(100, 'Password too long'),
  role: z.enum(['ADMIN', 'MEMBER']).optional().default('MEMBER'),
});

const loginSchema = z.object({
  email: z
    .string({ required_error: 'Email is required' })
    .email('Please provide a valid email')
    .toLowerCase()
    .trim(),
  password: z
    .string({ required_error: 'Password is required' })
    .min(1, 'Password is required'),
});

module.exports = { signupSchema, loginSchema };
