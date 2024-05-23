import { Redis } from '@upstash/redis';

export const cache = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_TOKEN
});
