const { sendError } = require('../utils/helpers');

/**
 * Validates request body against a Zod schema
 */
const validate = (schema) => {
  return (req, res, next) => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      const errors = result.error.issues.map((issue) => ({
        field: issue.path.join('.'),
        message: issue.message,
      }));
      return sendError(res, 'Validation failed', 400, errors);
    }

    // Replace body with parsed (and potentially transformed) data
    req.body = result.data;
    next();
  };
};

module.exports = { validate };
