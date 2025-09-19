import Redis from 'ioredis';

const redisConfig = {
  host: process.env.REDIS_HOST || 'localhost',
  port: Number(process.env.REDIS_PORT) || 6379,
  password: process.env.REDIS_PASSWORD || undefined,
  db: Number(process.env.REDIS_DB) || 0,
  retryDelayOnFailover: 100,
  maxRetriesPerRequest: 3,
  lazyConnect: true,
};

export const redis = new Redis(redisConfig);

// Handle Redis connection events
redis.on('error', _error => {
  // Redis connection errors are handled by the application's error handling
  // Logging is done through the winston logger in production
});

export default redis;
