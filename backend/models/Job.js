const mongoose = require("mongoose");
const { VALID_STATUSES } = require("../schemas/job");

const VALID_SOURCES = ['gmail', 'manual'];

const StatusHistorySchema = new mongoose.Schema(
  {
    status: { type: String, required: true, enum: VALID_STATUSES },
    at: { type: Date, default: Date.now },
    source: { type: String, enum: VALID_SOURCES },
    emailId: { type: String },
    subject: { type: String, maxlength: 500 },
  },
  { _id: false }
);

const jobSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    company:  { type: String, required: true, trim: true, maxlength: 200 },
    role:     { type: String, required: true, trim: true, maxlength: 200 },
    location: { type: String, trim: true, maxlength: 200 },
    status: {
      type: String,
      required: true,
      enum: VALID_STATUSES,
      default: 'Applied',
    },
    stipend:       { type: String, trim: true, maxlength: 100 },
    dateApplied:   { type: Date },
    interviewDate: { type: Date },
    notes:         { type: String, maxlength: 5000 },
    emailId:     { type: String },

    normalizedCompany: { type: String, index: true },
    normalizedRole:    { type: String, index: true },

    statusHistory: { type: [StatusHistorySchema], default: [] },
  },
  { timestamps: true }
);

const normalizeKey = (value) =>
  (value || '')
    .toString()
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ');

jobSchema.pre('save', function setNormalized(next) {
  this.normalizedCompany = normalizeKey(this.company);
  this.normalizedRole = normalizeKey(this.role);
  next();
});

jobSchema.index({ userId: 1, normalizedCompany: 1, normalizedRole: 1 });
jobSchema.index({ userId: 1, dateApplied: -1, createdAt: -1 });
// sparse: emailId is null on manually-added jobs; only Gmail-imported jobs have it
jobSchema.index({ emailId: 1 }, { sparse: true });

module.exports = mongoose.model("Job", jobSchema);
