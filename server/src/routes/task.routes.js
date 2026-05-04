const express = require('express');
const {
  createTask,
  getTasks,
  getTask,
  updateTask,
  deleteTask,
} = require('../controllers/task.controller');
const { protect } = require('../middleware/auth');
const { requireProjectMember, requireProjectAdmin } = require('../middleware/projectAuth');
const { validate } = require('../middleware/validate');
const { createTaskSchema, updateTaskSchema } = require('./task.schema');

const router = express.Router({ mergeParams: true });
// mergeParams: true allows access to :projectId from parent router

// All task routes require auth + project membership
router.use(protect);
router.use(requireProjectMember);

// ─── Task CRUD ────────────────────────────────────────────
router.post('/', requireProjectAdmin, validate(createTaskSchema), createTask);
router.get('/', getTasks);
router.get('/:taskId', getTask);
router.patch('/:taskId', validate(updateTaskSchema), updateTask);
router.delete('/:taskId', requireProjectAdmin, deleteTask);

module.exports = router;
