const { z } = require('zod');

const markProcessedSchema = z.object({
  emailId: z.string().min(1, 'emailId is required'),
});

module.exports = { markProcessedSchema };
