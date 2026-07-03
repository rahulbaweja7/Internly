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
  interviewDate:          z.coerce.date().optional(),
  emailId:                z.string().optional(),
  subject:                z.string().max(500).optional(),
  onlyUpdateStatusIfExists: z.boolean().optional(),
});

const updateJobSchema = z.object({
  company:       z.string().min(1).max(200).trim().optional(),
  role:          z.string().min(1).max(200).trim().optional(),
  status:        z.enum(VALID_STATUSES).optional(),
  location:      z.string().max(200).trim().optional(),
  stipend:       z.string().max(100).optional(),
  dateApplied:   z.coerce.date().optional(),
  interviewDate: z.coerce.date().nullable().optional(),
  notes:         z.string().max(5000).optional(),
}).strict();

const bulkJobItemSchema = z.object({
  company:     z.string().min(1).max(200).trim(),
  role:        z.string().max(200).trim().optional(),
  position:    z.string().max(200).trim().optional(),
  status:      z.enum(VALID_STATUSES).optional(),
  location:    z.string().max(200).trim().optional(),
  stipend:     z.string().max(100).optional(),
  dateApplied: z.coerce.date().optional(),
  notes:       z.string().max(5000).optional(),
  emailId:     z.string().max(200).optional(),
  subject:     z.string().max(500).optional(),
});

const bulkJobSchema = z.object({
  jobs: z.array(bulkJobItemSchema).min(1).max(200),
});

module.exports = { createJobSchema, updateJobSchema, bulkJobSchema, VALID_STATUSES };
