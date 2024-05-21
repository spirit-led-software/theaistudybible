import { Redis } from '@upstash/redis';

export const cache = Redis.fromEnv();
