const { Redis } = require('ioredis');

// maxRetriesPerRequest: null is required by BullMQ workers
const connection = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
});

connection.on('error', (err) => {
  console.error('[Redis] Connection error:', err.message);
});

module.exports = connection;
