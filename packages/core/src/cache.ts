import { Redis } from 'ioredis';

const redisUrl = new URL(process.env.REDIS_URL);

export const cache = new Redis({
  host: redisUrl.hostname,
  port: parseInt(redisUrl.port),
  username: redisUrl.username,
  password: redisUrl.password,
  maxRetriesPerRequest: null
});
