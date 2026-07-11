const Redis = require('ioredis');
require('dotenv').config();

let redis = null;

if (process.env.NODE_ENV === 'test') {
  redis = null;
} else {
  const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

  redis = new Redis(redisUrl, {
    maxRetriesPerRequest: 3,
    retryStrategy(times) {
      if (times > 3) {
        console.warn('⚠️ Redis no disponible, el caché se desactivará.');
        return null;
      }
      return Math.min(times * 200, 2000);
    },
    lazyConnect: true,
  });

  redis.on('connect', () => {
    console.log('✅ Conexión a Redis establecida.');
  });

  redis.on('error', (err) => {
    console.error('❌ Error de Redis:', err.message);
  });

  redis.on('close', () => {
    console.warn('⚠️ Conexión Redis cerrada.');
  });
}

module.exports = redis;
