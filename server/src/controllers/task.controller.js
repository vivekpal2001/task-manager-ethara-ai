const prisma = require('../utils/prisma');
const { asyncHandler, sendSuccess, sendError } = require('../utils/helpers');

/**
 * POST /api/projects/:projectId/tasks
 * Create a task within a project (admin only)
 */
const createTask = asyncHandler(async (req, res) => {
  const { title, description, status, priority, assigneeId, dueDate } = req.body;
  const { projectId } = req.params;

  // If assignee is provided, verify they are a project member
  if (assigneeId) {
    const isMember = await prisma.projectMember.findUnique({
      where: { projectId_userId: { projectId, userId: assigneeId } },
    });
    if (!isMember && req.project.ownerId !== assigneeId) {
      return sendError(res, 'Assignee must be a member of this project', 400);
    }
  }

  const task = await prisma.task.create({
    data: {
      title,
      description,
      status,
      priority,
      dueDate: dueDate ? new Date(dueDate) : null,
      projectId,
      assigneeId: assigneeId || null,
      createdById: req.user.id,
    },
    include: {
      assignee: { select: { id: true, name: true, email: true } },
      createdBy: { select: { id: true, name: true, email: true } },
    },
  });

  sendSuccess(res, { task }, 'Task created successfully', 201);
});

/**
 * GET /api/projects/:projectId/tasks
 * List tasks in a project with optional filters
 * Query params: status, priority, assigneeId, search, sort
 */
const getTasks = asyncHandler(async (req, res) => {
  const { projectId } = req.params;
  const { status, priority, assigneeId, search, sort } = req.query;

  // Build filter
  const where = { projectId };
  if (status) where.status = status;
  if (priority) where.priority = priority;
  if (assigneeId) where.assigneeId = assigneeId;
  if (search) {
    where.OR = [
      { title: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } },
    ];
  }

  // Build sort order
  let orderBy = { createdAt: 'desc' };
  if (sort === 'dueDate') orderBy = { dueDate: 'asc' };
  if (sort === 'priority') orderBy = { priority: 'asc' };
  if (sort === 'status') orderBy = { status: 'asc' };

  const tasks = await prisma.task.findMany({
    where,
    include: {
      assignee: { select: { id: true, name: true, email: true } },
      createdBy: { select: { id: true, name: true } },
    },
    orderBy,
  });

  sendSuccess(res, { tasks, count: tasks.length }, 'Tasks fetched');
});

/**
 * GET /api/projects/:projectId/tasks/:taskId
 * Get a single task detail
 */
const getTask = asyncHandler(async (req, res) => {
  const { projectId, taskId } = req.params;

  const task = await prisma.task.findFirst({
    where: { id: taskId, projectId },
    include: {
      assignee: { select: { id: true, name: true, email: true } },
      createdBy: { select: { id: true, name: true, email: true } },
      project: { select: { id: true, name: true } },
    },
  });

  if (!task) {
    return sendError(res, 'Task not found', 404);
  }

  sendSuccess(res, { task }, 'Task fetched');
});

/**
 * PATCH /api/projects/:projectId/tasks/:taskId
 * Update a task
 * - Admins: can update everything
 * - Members: can only update status of tasks assigned to them
 */
const updateTask = asyncHandler(async (req, res) => {
  const { projectId, taskId } = req.params;

  // Find the task first
  const existingTask = await prisma.task.findFirst({
    where: { id: taskId, projectId },
  });

  if (!existingTask) {
    return sendError(res, 'Task not found', 404);
  }

  // If user is a MEMBER (not admin), they can only update status on their own tasks
  if (req.projectRole !== 'ADMIN') {
    if (existingTask.assigneeId !== req.user.id) {
      return sendError(res, 'You can only update tasks assigned to you', 403);
    }
    // Members can only change status
    const allowedFields = ['status'];
    const attemptedFields = Object.keys(req.body);
    const disallowed = attemptedFields.filter(f => !allowedFields.includes(f));
    if (disallowed.length > 0) {
      return sendError(res, `Members can only update: ${allowedFields.join(', ')}`, 403);
    }
  }

  const { title, description, status, priority, assigneeId, dueDate } = req.body;

  // If reassigning, verify the new assignee is a project member
  if (assigneeId !== undefined && assigneeId !== null) {
    const isMember = await prisma.projectMember.findUnique({
      where: { projectId_userId: { projectId, userId: assigneeId } },
    });
    if (!isMember && req.project.ownerId !== assigneeId) {
      return sendError(res, 'Assignee must be a member of this project', 400);
    }
  }

  const updateData = {};
  if (title !== undefined) updateData.title = title;
  if (description !== undefined) updateData.description = description;
  if (status !== undefined) updateData.status = status;
  if (priority !== undefined) updateData.priority = priority;
  if (assigneeId !== undefined) updateData.assigneeId = assigneeId;
  if (dueDate !== undefined) updateData.dueDate = dueDate ? new Date(dueDate) : null;

  const task = await prisma.task.update({
    where: { id: taskId },
    data: updateData,
    include: {
      assignee: { select: { id: true, name: true, email: true } },
      createdBy: { select: { id: true, name: true, email: true } },
    },
  });

  sendSuccess(res, { task }, 'Task updated successfully');
});

/**
 * DELETE /api/projects/:projectId/tasks/:taskId
 * Delete a task (admin only)
 */
const deleteTask = asyncHandler(async (req, res) => {
  const { projectId, taskId } = req.params;

  const task = await prisma.task.findFirst({
    where: { id: taskId, projectId },
  });

  if (!task) {
    return sendError(res, 'Task not found', 404);
  }

  await prisma.task.delete({ where: { id: taskId } });

  sendSuccess(res, null, 'Task deleted successfully');
});

// ─── Dashboard / Overview ─────────────────────────────────

/**
 * GET /api/dashboard
 * Get dashboard data for the current user:
 *   - My tasks (assigned to me)
 *   - Task stats across all my projects
 *   - Overdue tasks
 */
const getDashboard = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  // Get all project IDs the user is part of
  const memberships = await prisma.projectMember.findMany({
    where: { userId },
    select: { projectId: true },
  });
  const ownedProjects = await prisma.project.findMany({
    where: { ownerId: userId },
    select: { id: true },
  });

  const projectIds = [
    ...new Set([
      ...memberships.map(m => m.projectId),
      ...ownedProjects.map(p => p.id),
    ]),
  ];

  // My assigned tasks
  const myTasks = await prisma.task.findMany({
    where: { assigneeId: userId },
    include: {
      project: { select: { id: true, name: true } },
    },
    orderBy: { dueDate: 'asc' },
  });

  // Overdue tasks (assigned to me, not done, past due date)
  const now = new Date();
  const overdueTasks = await prisma.task.findMany({
    where: {
      assigneeId: userId,
      status: { not: 'DONE' },
      dueDate: { lt: now },
    },
    include: {
      project: { select: { id: true, name: true } },
    },
    orderBy: { dueDate: 'asc' },
  });

  // Stats across all my projects
  const taskStats = await prisma.task.groupBy({
    by: ['status'],
    where: { projectId: { in: projectIds } },
    _count: { status: true },
  });

  const stats = taskStats.reduce(
    (acc, item) => {
      acc[item.status] = item._count.status;
      acc.total += item._count.status;
      return acc;
    },
    { TODO: 0, IN_PROGRESS: 0, DONE: 0, total: 0 }
  );

  // Project count
  const projectCount = projectIds.length;

  sendSuccess(res, {
    stats,
    projectCount,
    myTasks,
    overdueTasks,
    overdueCount: overdueTasks.length,
  }, 'Dashboard data fetched');
});

module.exports = {
  createTask,
  getTasks,
  getTask,
  updateTask,
  deleteTask,
  getDashboard,
};
