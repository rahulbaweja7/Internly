/**
 * Zod validation middleware factory.
 * Validates req.body against schema, replaces it with parsed (coerced) data,
 * and returns 400 with structured errors on failure.
 */
const validate = (schema) => (req, res, next) => {
  const result = schema.safeParse(req.body);
  if (!result.success) {
    const issues = result.error.issues.map((i) => ({
      field: i.path.join('.') || 'body',
      message: i.message,
    }));
    return res.status(400).json({ error: 'Validation failed', issues });
  }
  req.body = result.data;
  next();
};

module.exports = validate;
