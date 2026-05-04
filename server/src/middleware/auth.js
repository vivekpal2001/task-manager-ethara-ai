const { verifyToken } = require('../utils/jwt');
const { sendError } = require('../utils/helpers');
const prisma = require('../utils/prisma');

/**
 * Protect routes — verifies JWT and attaches user to req
 */
const protect = async (req, res, next) => {
  try {
    let token;

    // Check Authorization header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return sendError(res, 'Not authorized — no token provided', 401);
    }

    // Verify token
    const decoded = verifyToken(token);

    // Check if user still exists
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: { id: true, name: true, email: true, role: true },
    });

    if (!user) {
      return sendError(res, 'User no longer exists', 401);
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return sendError(res, 'Invalid token', 401);
    }
    if (error.name === 'TokenExpiredError') {
      return sendError(res, 'Token expired — please log in again', 401);
    }
    return sendError(res, 'Authorization failed', 401);
  }
};

/**
 * Restrict to specific global roles
 */
const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return sendError(res, 'You do not have permission to perform this action', 403);
    }
    next();
  };
};

module.exports = { protect, restrictTo };
