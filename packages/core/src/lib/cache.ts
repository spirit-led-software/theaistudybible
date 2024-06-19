import { Redis } from 'ioredis';

const redisUrl = new URL(process.env.REDIS_URL);

export const cache = new Redis({
  host: redisUrl.host,
  port: parseInt(redisUrl.port),
  username: redisUrl.username,
  password: redisUrl.password
});
