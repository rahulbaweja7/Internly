const express = require('express');
const mongoose = require('mongoose');
const { isAuthenticated } = require('../middleware/auth');
const Job = require('../models/Job');
const Friendship = require('../models/Friendship');

const router = express.Router();

const startOfWeek = (d = new Date()) => {
  const date = new Date(d);
  const day = (date.getUTCDay() + 6) % 7; // make Monday=0
  date.setUTCDate(date.getUTCDate() - day);
  date.setUTCHours(0, 0, 0, 0);
  return date;
};

// Weekly counts for a set of userIds (prefers dateApplied over createdAt)
async function weeklyCounts(userIds, weeks = 4) {
  const now = new Date();
  const start = startOfWeek(new Date(now.getTime() - (weeks - 1) * 7 * 24 * 60 * 60 * 1000));
  const pipeline = [
    { $match: { userId: { $in: userIds.map((id) => new mongoose.Types.ObjectId(id)) }, $or: [ { dateApplied: { $gte: start } }, { dateApplied: null }, { dateApplied: { $exists: false } }, { createdAt: { $gte: start } } ] } },
    {
      $project: {
        userId: 1,
        baseDate: { $ifNull: ['$dateApplied', '$createdAt'] },
        week: { $dateTrunc: { date: { $ifNull: ['$dateApplied', '$createdAt'] }, unit: 'week', binSize: 1, timezone: 'UTC' } },
      },
    },
    { $group: { _id: { userId: '$userId', week: '$week' }, count: { $sum: 1 } } },
    {
      $group: {
        _id: '$_id.userId',
        total: { $sum: '$count' },
        weeks: { $push: { week: '$_id.week', count: '$count' } },
      },
    },
  ];
  const rows = await Job.aggregate(pipeline).allowDiskUse(true);
  const map = new Map();
  for (const r of rows) map.set(String(r._id), { total: r.total, weeks: r.weeks });
  return map;
}

// Global leaderboard (top N by applications in last N weeks)
router.get('/global', isAuthenticated, async (req, res) => {
  try {
    const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 20));
    const weeks = Math.min(12, Math.max(1, Number(req.query.weeks) || 4));
    const start = startOfWeek(new Date(Date.now() - (weeks - 1) * 7 * 24 * 60 * 60 * 1000));
    const pipeline = [
      { $match: { $or: [ { dateApplied: { $gte: start } }, { dateApplied: null }, { dateApplied: { $exists: false } }, { createdAt: { $gte: start } } ] } },
      { $project: { userId: 1, baseDate: { $ifNull: ['$dateApplied', '$createdAt'] }, week: { $dateTrunc: { date: { $ifNull: ['$dateApplied', '$createdAt'] }, unit: 'week', binSize: 1, timezone: 'UTC' } } } },
      { $group: { _id: { userId: '$userId', week: '$week' }, count: { $sum: 1 } } },
      { $group: { _id: '$_id.userId', total: { $sum: '$count' } } },
      { $sort: { total: -1 } },
      { $limit: limit },
      { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'user' } },
      { $unwind: '$user' },
      { $project: { _id: 0, userId: '$_id', total: 1, user: { name: '$user.name', picture: '$user.picture' } } },
    ];
    const rows = await Job.aggregate(pipeline);
    // Fetch weekly series for these users
    const ids = rows.map((r) => String(r.userId));
    const seriesMap = await weeklyCounts(ids, weeks);
    const enriched = rows.map((r) => ({ ...r, weeks: (seriesMap.get(String(r.userId)) || {}).weeks || [] }));
    res.json({ leaderboard: enriched });
  } catch (e) {
    console.error('Global leaderboard error:', e);
    res.status(500).json({ error: 'Failed to fetch global leaderboard' });
  }
});

// Friends leaderboard (includes current user)
router.get('/friends', isAuthenticated, async (req, res) => {
  try {
    const weeks = Math.min(12, Math.max(1, Number(req.query.weeks) || 4));
    const docs = await Friendship.find({
      status: 'accepted',
      $or: [{ requester: req.user._id }, { recipient: req.user._id }],
    });
    const friendIds = new Set([String(req.user._id)]);
    for (const f of docs) {
      friendIds.add(String(f.requester));
      friendIds.add(String(f.recipient));
    }
    const ids = Array.from(friendIds);
    const counts = await weeklyCounts(ids, weeks);
    // materialize with user names
    const users = await mongoose.model('User').find({ _id: { $in: ids } }, 'name picture');
    const info = new Map(users.map((u) => [String(u._id), { name: u.name, picture: u.picture }]));
    const leaderboard = ids
      .map((id) => ({ userId: id, total: (counts.get(id) || {}).total || 0, user: info.get(id) || {} }))
      .sort((a, b) => b.total - a.total);
    res.json({ leaderboard });
  } catch (e) {
    console.error('Friends leaderboard error:', e);
    res.status(500).json({ error: 'Failed to fetch friends leaderboard' });
  }
});

module.exports = router;


