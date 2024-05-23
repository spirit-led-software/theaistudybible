import { building } from '$app/environment';
import { UPSTASH_REDIS_REST_URL, UPSTASH_REDIS_TOKEN } from '$env/static/private';
import { Redis } from '@upstash/redis';

export let cache: Redis;
if (!building) {
  cache = new Redis({
    url: UPSTASH_REDIS_REST_URL,
    token: UPSTASH_REDIS_TOKEN
  });
}
