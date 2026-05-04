const prisma = require('../utils/prisma');
const { asyncHandler, sendSuccess, sendError } = require('../utils/helpers');

/**
 * POST /api/projects
 * Create a new project (any authenticated user)
 */
const createProject = asyncHandler(async (req, res) => {
  const { name, description, deadline } = req.body;

  const project = await prisma.project.create({
    data: {
      name,
      description,
      deadline: deadline ? new Date(deadline) : null,
      ownerId: req.user.id,
      // Auto-add the creator as ADMIN member
      members: {
        create: {
          userId: req.user.id,
          role: 'ADMIN',
        },
      },
    },
    include: {
      owner: {
        select: { id: true, name: true, email: true },
      },
      members: {
        include: {
          user: { select: { id: true, name: true, email: true } },
        },
      },
      _count: { select: { tasks: true } },
    },
  });

  sendSuccess(res, { project }, 'Project created successfully', 201);
});

/**
 * GET /api/projects
 * List all projects the user is a member of (or owns)
 */
const getProjects = asyncHandler(async (req, res) => {
  const projects = await prisma.project.findMany({
    where: {
      OR: [
        { ownerId: req.user.id },
        { members: { some: { userId: req.user.id } } },
      ],
    },
    include: {
      owner: {
        select: { id: true, name: true, email: true },
      },
      _count: {
        select: { tasks: true, members: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  sendSuccess(res, { projects }, 'Projects fetched');
});

/**
 * GET /api/projects/:projectId
 * Get project detail with members and task stats
 */
const getProject = asyncHandler(async (req, res) => {
  const project = await prisma.project.findUnique({
    where: { id: req.params.projectId },
    include: {
      owner: {
        select: { id: true, name: true, email: true },
      },
      members: {
        include: {
          user: { select: { id: true, name: true, email: true } },
        },
        orderBy: { joinedAt: 'asc' },
      },
      _count: { select: { tasks: true } },
    },
  });

  // Get task status breakdown
  const taskStats = await prisma.task.groupBy({
    by: ['status'],
    where: { projectId: req.params.projectId },
    _count: { status: true },
  });

  sendSuccess(res, {
    project,
    taskStats: taskStats.reduce((acc, item) => {
      acc[item.status] = item._count.status;
      return acc;
    }, { TODO: 0, IN_PROGRESS: 0, DONE: 0 }),
  }, 'Project details fetched');
});

/**
 * PATCH /api/projects/:projectId
 * Update a project (admin only)
 */
const updateProject = asyncHandler(async (req, res) => {
  const { name, description, deadline } = req.body;

  const updateData = {};
  if (name !== undefined) updateData.name = name;
  if (description !== undefined) updateData.description = description;
  if (deadline !== undefined) updateData.deadline = deadline ? new Date(deadline) : null;

  const project = await prisma.project.update({
    where: { id: req.params.projectId },
    data: updateData,
    include: {
      owner: {
        select: { id: true, name: true, email: true },
      },
      _count: { select: { tasks: true, members: true } },
    },
  });

  sendSuccess(res, { project }, 'Project updated successfully');
});

/**
 * DELETE /api/projects/:projectId
 * Delete a project (admin only — cascades tasks & members)
 */
const deleteProject = asyncHandler(async (req, res) => {
  await prisma.project.delete({
    where: { id: req.params.projectId },
  });

  sendSuccess(res, null, 'Project deleted successfully');
});

// ─── Member Management ────────────────────────────────────

/**
 * POST /api/projects/:projectId/members
 * Add a member to the project (admin only)
 */
const addMember = asyncHandler(async (req, res) => {
  const { email, role } = req.body;
  const { projectId } = req.params;

  // Find the user by email
  const userToAdd = await prisma.user.findUnique({ where: { email } });
  if (!userToAdd) {
    return sendError(res, 'No user found with this email', 404);
  }

  // Check if already a member
  const existingMember = await prisma.projectMember.findUnique({
    where: {
      projectId_userId: { projectId, userId: userToAdd.id },
    },
  });

  if (existingMember) {
    return sendError(res, 'User is already a member of this project', 409);
  }

  const member = await prisma.projectMember.create({
    data: {
      projectId,
      userId: userToAdd.id,
      role: role || 'MEMBER',
    },
    include: {
      user: { select: { id: true, name: true, email: true } },
    },
  });

  sendSuccess(res, { member }, 'Member added successfully', 201);
});

/**
 * GET /api/projects/:projectId/members
 * List all members of a project
 */
const getMembers = asyncHandler(async (req, res) => {
  const members = await prisma.projectMember.findMany({
    where: { projectId: req.params.projectId },
    include: {
      user: { select: { id: true, name: true, email: true } },
    },
    orderBy: { joinedAt: 'asc' },
  });

  sendSuccess(res, { members }, 'Members fetched');
});

/**
 * DELETE /api/projects/:projectId/members/:userId
 * Remove a member from the project (admin only)
 */
const removeMember = asyncHandler(async (req, res) => {
  const { projectId, userId } = req.params;

  // Prevent removing the project owner
  if (req.project.ownerId === userId) {
    return sendError(res, 'Cannot remove the project owner', 400);
  }

  // Prevent removing yourself if you're the only admin
  if (userId === req.user.id) {
    return sendError(res, 'You cannot remove yourself — transfer ownership first', 400);
  }

  const member = await prisma.projectMember.findUnique({
    where: {
      projectId_userId: { projectId, userId },
    },
  });

  if (!member) {
    return sendError(res, 'User is not a member of this project', 404);
  }

  await prisma.projectMember.delete({
    where: { id: member.id },
  });

  sendSuccess(res, null, 'Member removed successfully');
});

module.exports = {
  createProject,
  getProjects,
  getProject,
  updateProject,
  deleteProject,
  addMember,
  getMembers,
  removeMember,
};
