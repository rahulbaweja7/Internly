const { Redis } = require('ioredis');

// Only called when REDIS_URL is confirmed set (checked in index.js before requiring this)
const connection = new Redis(process.env.REDIS_URL, {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
  lazyConnect: true,
});

connection.on('error', (err) => {
  console.error('[Redis/BullMQ] Connection error:', err.message);
});

module.exports = connection;
