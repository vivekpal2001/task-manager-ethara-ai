const { z } = require('zod');

const createTaskSchema = z.object({
  title: z
    .string({ required_error: 'Task title is required' })
    .min(2, 'Title must be at least 2 characters')
    .max(200, 'Title must be at most 200 characters')
    .trim(),
  description: z
    .string()
    .max(1000, 'Description must be at most 1000 characters')
    .trim()
    .optional(),
  status: z.enum(['TODO', 'IN_PROGRESS', 'DONE']).optional().default('TODO'),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH']).optional().default('MEDIUM'),
  assigneeId: z.string().uuid('Invalid assignee ID').optional().nullable(),
  dueDate: z
    .string()
    .datetime({ message: 'Invalid date format — use ISO 8601' })
    .optional()
    .nullable(),
});

const updateTaskSchema = z.object({
  title: z
    .string()
    .min(2, 'Title must be at least 2 characters')
    .max(200, 'Title must be at most 200 characters')
    .trim()
    .optional(),
  description: z
    .string()
    .max(1000, 'Description must be at most 1000 characters')
    .trim()
    .optional()
    .nullable(),
  status: z.enum(['TODO', 'IN_PROGRESS', 'DONE']).optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH']).optional(),
  assigneeId: z.string().uuid('Invalid assignee ID').optional().nullable(),
  dueDate: z
    .string()
    .datetime({ message: 'Invalid date format — use ISO 8601' })
    .optional()
    .nullable(),
});

module.exports = { createTaskSchema, updateTaskSchema };
