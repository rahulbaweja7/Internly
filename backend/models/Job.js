const mongoose = require("mongoose");

const StatusHistorySchema = new mongoose.Schema(
  {
    status: { type: String, required: true },
    at: { type: Date, default: Date.now },
    source: { type: String }, // e.g., gmail, manual
    emailId: { type: String },
    subject: { type: String },
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
    company: { type: String, required: true },
    role: { type: String, required: true },
    location: { type: String },
    status: { type: String, required: true }, // Applied, Online Assessment, Phone Interview, Technical Interview, Final Interview, Accepted, Rejected, Waitlisted, Withdrawn
    stipend: { type: String },
    dateApplied: { type: Date },
    notes: { type: String },
    emailId: { type: String }, // Gmail message ID to track processed emails

    // Normalized keys for deduplication
    normalizedCompany: { type: String, index: true },
    normalizedRole: { type: String, index: true },

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

module.exports = mongoose.model("Job", jobSchema);