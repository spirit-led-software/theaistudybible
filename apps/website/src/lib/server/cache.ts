import { Redis } from '@upstash/redis';
import { Resource } from 'sst';

export const cache = new Redis({
  url: Resource.UpstashRedis.restUrl,
  token: Resource.UpstashRedis.restToken
});
