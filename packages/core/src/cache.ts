import { Redis } from '@upstash/redis/cloudflare';
import { Resource } from 'sst';

let currentCache: Redis | undefined;
export const cache = () => {
  if (!currentCache) {
    currentCache = new Redis({
      url: Resource.UpstashRedis.restUrl,
      token: Resource.UpstashRedis.restToken,
    });
  }
  return currentCache;
};
