const mongoose = require('mongoose');

const friendshipSchema = new mongoose.Schema({
  requester: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  status: { type: String, enum: ['pending', 'accepted', 'blocked'], default: 'pending', index: true },
  pairKey: { type: String, required: true, unique: true },
}, { timestamps: true });

// Ensure pairKey is normalized as smallerId-biggerId for symmetric uniqueness
friendshipSchema.pre('validate', function(next) {
  try {
    const a = String(this.requester);
    const b = String(this.recipient);
    if (!a || !b) return next(new Error('requester and recipient are required'));
    this.pairKey = a < b ? `${a}-${b}` : `${b}-${a}`;
    next();
  } catch (e) {
    next(e);
  }
});

module.exports = mongoose.model('Friendship', friendshipSchema);


