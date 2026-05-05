/**
 * Global error handler middleware
 */
const errorHandler = (err, req, res, next) => {
  console.error('❌ Error:', err.message);

  if (process.env.NODE_ENV === 'development') {
    console.error(err.stack);
  }

  // Prisma connection errors
  if (err.code === 'P1001' || (err.message && err.message.includes("Can't reach database server"))) {
    return res.status(503).json({
      success: false,
      message: 'Database connection failed. Please check your network and try again.',
    });
  }

  // Prisma known errors
  if (err.code === 'P2002') {
    const field = err.meta?.target?.[0] || 'field';
    return res.status(409).json({
      success: false,
      message: `A record with this ${field} already exists`,
    });
  }

  if (err.code === 'P2025') {
    return res.status(404).json({
      success: false,
      message: 'Record not found',
    });
  }

  // Default fallback
  const statusCode = err.statusCode || 500;
  // If it's a 500 error, don't expose raw stack traces/long queries to the frontend
  const isServerError = statusCode === 500;
  const friendlyMessage = isServerError 
    ? 'Something went wrong on our end. Please try again.' 
    : err.message || 'Internal server error';

  res.status(statusCode).json({
    success: false,
    message: isServerError && err.message?.includes('PrismaClient') ? friendlyMessage : err.message || friendlyMessage,
  });
};

module.exports = { errorHandler };
