import { building } from '$app/environment';
import { Redis } from '@upstash/redis';
import { Resource } from 'sst';

export let cache: Redis;
if (!building) {
  cache = new Redis({
    url: Resource.UpstashRedis.restUrl,
    token: Resource.UpstashRedis.restToken
  });
}
