const bcrypt = require('bcryptjs');
const prisma = require('../utils/prisma');
const { signToken } = require('../utils/jwt');
const { asyncHandler, sendSuccess, sendError } = require('../utils/helpers');

/**
 * POST /api/auth/signup
 * Register a new user
 */
const signup = asyncHandler(async (req, res) => {
  const { name, email, password, role } = req.body;

  // Check if user already exists
  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    return sendError(res, 'An account with this email already exists', 409);
  }

  // Hash password
  const salt = await bcrypt.genSalt(12);
  const passwordHash = await bcrypt.hash(password, salt);

  // Create user
  const user = await prisma.user.create({
    data: {
      name,
      email,
      passwordHash,
      role: role || 'MEMBER',
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
    },
  });

  // Generate token
  const token = signToken({ id: user.id, email: user.email, role: user.role });

  sendSuccess(res, { user, token }, 'Account created successfully', 201);
});

/**
 * POST /api/auth/login
 * Login with email & password
 */
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // Find user with password
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return sendError(res, 'Invalid email or password', 401);
  }

  // Verify password
  const isMatch = await bcrypt.compare(password, user.passwordHash);
  if (!isMatch) {
    return sendError(res, 'Invalid email or password', 401);
  }

  // Generate token
  const token = signToken({ id: user.id, email: user.email, role: user.role });

  sendSuccess(res, {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
    token,
  }, 'Logged in successfully');
});

/**
 * GET /api/auth/me
 * Get current user profile (protected)
 */
const getMe = asyncHandler(async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
      _count: {
        select: {
          assignedTasks: true,
          ownedProjects: true,
        },
      },
    },
  });

  sendSuccess(res, { user }, 'Profile fetched');
});

module.exports = { signup, login, getMe };
