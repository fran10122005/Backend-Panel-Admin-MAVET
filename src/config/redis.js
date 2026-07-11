const Redis = require('ioredis');
require('dotenv').config();

let redis = null;
let warningEmitido = false;

if (process.env.NODE_ENV === 'test') {
  redis = null;
} else {
  const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

  redis = new Redis(redisUrl, {
    maxRetriesPerRequest: null,
    retryStrategy(times) {
      if (times > 3) {
        if (!warningEmitido) {
          warningEmitido = true;
          console.warn('⚠️ Redis no disponible, el caché se desactivará.');
        }
        return null;
      }
      return Math.min(times * 500, 3000);
    },
    lazyConnect: true,
  });

  redis.on('connect', () => {
    console.log('✅ Conexión a Redis establecida.');
  });

  // Necesario para evitar que ioredis lance "Unhandled error event"
  redis.on('error', () => {});
}

module.exports = redis;
