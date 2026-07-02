const mongoose = require('mongoose');

const gmailTokenSchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true },
  access_token: { type: String, required: true },
  refresh_token: { type: String, required: true },
  scope: { type: String, required: true },
  token_type: { type: String, required: true, enum: ['Bearer'] },
  expiry_date: { type: Number, required: true },
  // Gmail history cursor — enables incremental sync (only new messages since last fetch)
  historyId: { type: String },
  lastSyncAt: { type: Date },
  // Set true when a scan fails with an auth error (expired/revoked token).
  // Cleared to false when fresh tokens are stored via OAuth reconnect.
  tokenInvalid: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

gmailTokenSchema.pre('save', function (next) {
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model('GmailToken', gmailTokenSchema);


