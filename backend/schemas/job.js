const { z } = require('zod');

const VALID_STATUSES = [
  'Applied', 'Online Assessment', 'Phone Interview',
  'Technical Interview', 'Final Interview',
  'Accepted', 'Rejected', 'Waitlisted', 'Withdrawn',
];

const createJobSchema = z.object({
  company:                z.string().min(1, 'Company is required').max(200).trim(),
  role:                   z.string().min(1, 'Role is required').max(200).trim(),
  status:                 z.enum(VALID_STATUSES).optional().default('Applied'),
  location:               z.string().max(200).trim().optional(),
  stipend:                z.string().max(100).optional(),
  dateApplied:            z.coerce.date().optional(),
  notes:                  z.string().max(5000).optional(),
  emailId:                z.string().optional(),
  subject:                z.string().max(500).optional(),
  onlyUpdateStatusIfExists: z.boolean().optional(),
});

module.exports = { createJobSchema, VALID_STATUSES };
