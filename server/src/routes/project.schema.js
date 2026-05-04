const { z } = require('zod');

const createProjectSchema = z.object({
  name: z
    .string({ required_error: 'Project name is required' })
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must be at most 100 characters')
    .trim(),
  description: z
    .string()
    .max(500, 'Description must be at most 500 characters')
    .trim()
    .optional(),
  deadline: z
    .string()
    .datetime({ message: 'Invalid date format — use ISO 8601' })
    .optional(),
});

const updateProjectSchema = z.object({
  name: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must be at most 100 characters')
    .trim()
    .optional(),
  description: z
    .string()
    .max(500, 'Description must be at most 500 characters')
    .trim()
    .optional(),
  deadline: z
    .string()
    .datetime({ message: 'Invalid date format — use ISO 8601' })
    .optional()
    .nullable(),
});

const addMemberSchema = z.object({
  email: z
    .string({ required_error: 'Email is required' })
    .email('Please provide a valid email')
    .toLowerCase()
    .trim(),
  role: z.enum(['ADMIN', 'MEMBER']).optional().default('MEMBER'),
});

module.exports = { createProjectSchema, updateProjectSchema, addMemberSchema };
