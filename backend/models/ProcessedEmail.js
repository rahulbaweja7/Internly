const mongoose = require('mongoose');

const processedEmailSchema = new mongoose.Schema({
  emailId: { type: String, required: true },
  userId: { type: String, required: true },
  processedAt: { type: Date, default: Date.now },
});

processedEmailSchema.index({ emailId: 1, userId: 1 }, { unique: true });

module.exports = mongoose.model('ProcessedEmail', processedEmailSchema);


