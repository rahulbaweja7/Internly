const express = require('express');
const { isAuthenticated } = require('../middleware/auth');
const User = require('../models/User');
const Friendship = require('../models/Friendship');

const router = express.Router();

// Send friend request
router.post('/request', isAuthenticated, async (req, res) => {
  try {
    const { email } = req.body || {};
    if (!email) return res.status(400).json({ error: 'Email is required' });
    const recipient = await User.findOne({ email: String(email).toLowerCase() });
    if (!recipient) return res.status(404).json({ error: 'User not found' });
    if (String(recipient._id) === String(req.user._id)) return res.status(400).json({ error: 'Cannot friend yourself' });

    const a = String(req.user._id);
    const b = String(recipient._id);
    const pairKey = a < b ? `${a}-${b}` : `${b}-${a}`;

    let friendship = await Friendship.findOne({ pairKey });
    if (friendship) {
      // If already accepted, return success; if pending and requester is same, no-op
      if (friendship.status === 'accepted') return res.json({ success: true, friendship });
      // If pending and roles reversed, accept it automatically
      if (friendship.status === 'pending' && String(friendship.requester) === String(recipient._id)) {
        friendship.status = 'accepted';
        await friendship.save();
        return res.json({ success: true, friendship });
      }
      return res.status(400).json({ error: 'Friend request already pending' });
    }

    friendship = new Friendship({ requester: req.user._id, recipient: recipient._id, status: 'pending' });
    await friendship.save();
    res.status(201).json({ success: true, friendship });
  } catch (e) {
    console.error('Friend request error:', e);
    res.status(500).json({ error: 'Failed to send friend request' });
  }
});

// Accept friend request
router.post('/accept', isAuthenticated, async (req, res) => {
  try {
    const { userId } = req.body || {};
    if (!userId) return res.status(400).json({ error: 'userId required' });
    const a = String(req.user._id);
    const b = String(userId);
    const pairKey = a < b ? `${a}-${b}` : `${b}-${a}`;
    const friendship = await Friendship.findOne({ pairKey });
    if (!friendship) return res.status(404).json({ error: 'Friend request not found' });
    if (friendship.status === 'accepted') return res.json({ success: true, friendship });
    // Only recipient can accept
    if (String(friendship.recipient) !== String(req.user._id)) {
      return res.status(403).json({ error: 'Only recipient can accept' });
    }
    friendship.status = 'accepted';
    await friendship.save();
    res.json({ success: true, friendship });
  } catch (e) {
    console.error('Accept friend error:', e);
    res.status(500).json({ error: 'Failed to accept friend' });
  }
});

// List friends (accepted only)
router.get('/list', isAuthenticated, async (req, res) => {
  try {
    const docs = await Friendship.find({
      status: 'accepted',
      $or: [{ requester: req.user._id }, { recipient: req.user._id }],
    }).populate('requester recipient', 'name email picture');
    const friends = docs.map((f) => {
      const other = String(f.requester._id) === String(req.user._id) ? f.recipient : f.requester;
      return other;
    });
    res.json({ friends });
  } catch (e) {
    console.error('List friends error:', e);
    res.status(500).json({ error: 'Failed to list friends' });
  }
});

// Pending requests: incoming (to me) and outgoing (from me)
router.get('/pending', isAuthenticated, async (req, res) => {
  try {
    const incoming = await Friendship.find({ status: 'pending', recipient: req.user._id })
      .populate('requester', 'name email picture');
    const outgoing = await Friendship.find({ status: 'pending', requester: req.user._id })
      .populate('recipient', 'name email picture');
    res.json({
      incoming: incoming.map((f) => ({ userId: f.requester._id, user: f.requester })),
      outgoing: outgoing.map((f) => ({ userId: f.recipient._id, user: f.recipient })),
    });
  } catch (e) {
    console.error('Pending friends error:', e);
    res.status(500).json({ error: 'Failed to fetch pending requests' });
  }
});

module.exports = router;


