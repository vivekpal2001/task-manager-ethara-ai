const express = require('express');
const {
  createProject,
  getProjects,
  getProject,
  updateProject,
  deleteProject,
  addMember,
  getMembers,
  removeMember,
} = require('../controllers/project.controller');
const { protect } = require('../middleware/auth');
const { requireProjectMember, requireProjectAdmin } = require('../middleware/projectAuth');
const { validate } = require('../middleware/validate');
const { createProjectSchema, updateProjectSchema, addMemberSchema } = require('./project.schema');

const router = express.Router();

// All project routes require authentication
router.use(protect);

// ─── Project CRUD ─────────────────────────────────────────
router.post('/', validate(createProjectSchema), createProject);
router.get('/', getProjects);
router.get('/:projectId', requireProjectMember, getProject);
router.patch('/:projectId', requireProjectMember, requireProjectAdmin, validate(updateProjectSchema), updateProject);
router.delete('/:projectId', requireProjectMember, requireProjectAdmin, deleteProject);

// ─── Member Management ───────────────────────────────────
router.get('/:projectId/members', requireProjectMember, getMembers);
router.post('/:projectId/members', requireProjectMember, requireProjectAdmin, validate(addMemberSchema), addMember);
router.delete('/:projectId/members/:userId', requireProjectMember, requireProjectAdmin, removeMember);

module.exports = router;
