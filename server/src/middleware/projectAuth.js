const prisma = require('../utils/prisma');
const { sendError } = require('../utils/helpers');

/**
 * Middleware: Check if user is a member of the project
 * Attaches req.project and req.projectMember
 */
const requireProjectMember = async (req, res, next) => {
  try {
    const { projectId } = req.params;

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        members: {
          where: { userId: req.user.id },
        },
      },
    });

    if (!project) {
      return sendError(res, 'Project not found', 404);
    }

    // Check if user is the owner OR a member
    const isOwner = project.ownerId === req.user.id;
    const membership = project.members[0];

    if (!isOwner && !membership) {
      return sendError(res, 'You are not a member of this project', 403);
    }

    req.project = project;
    req.projectRole = isOwner ? 'ADMIN' : (membership?.role || 'MEMBER');
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Middleware: Require ADMIN role within the project
 * Must be used AFTER requireProjectMember
 */
const requireProjectAdmin = (req, res, next) => {
  if (req.projectRole !== 'ADMIN') {
    return sendError(res, 'Only project admins can perform this action', 403);
  }
  next();
};

module.exports = { requireProjectMember, requireProjectAdmin };
