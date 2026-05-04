const prisma = require('../utils/prisma');
const { asyncHandler, sendSuccess } = require('../utils/helpers');

/**
 * GET /api/users
 * List all users (for member search/invite)
 */
const getUsers = asyncHandler(async (req, res) => {
  const { search } = req.query;

  const where = search
    ? {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
        ],
      }
    : {};

  const users = await prisma.user.findMany({
    where,
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
    },
    orderBy: { name: 'asc' },
    take: 20,
  });

  sendSuccess(res, { users }, 'Users fetched');
});

module.exports = { getUsers };
