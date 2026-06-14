const { Redis } = require('ioredis');
const logger = require('../utils/logger').child({ module: 'redis' });

// Only called when REDIS_URL is confirmed set (checked in index.js before requiring this)
const connection = new Redis(process.env.REDIS_URL, {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
  lazyConnect: true,
});

connection.on('error', (err) => {
  logger.error({ err }, 'Redis/BullMQ connection error');
});

module.exports = connection;
