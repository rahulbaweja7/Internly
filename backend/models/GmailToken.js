const mongoose = require('mongoose');

const gmailTokenSchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true },
  access_token: { type: String, required: true },
  refresh_token: { type: String, required: true },
  scope: { type: String, required: true },
  token_type: { type: String, required: true },
  expiry_date: { type: Number, required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

gmailTokenSchema.pre('save', function (next) {
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model('GmailToken', gmailTokenSchema);


