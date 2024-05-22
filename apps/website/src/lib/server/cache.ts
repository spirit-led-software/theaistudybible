import { building } from "$app/environment";
import { UpstashRedisCache } from "@langchain/community/caches/upstash_redis";
import { Redis } from "@upstash/redis";

export let cache: Redis;
if (!building) {
  cache = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_TOKEN,
  });
}

export let llmCache: UpstashRedisCache;
if (!building) {
  llmCache = new UpstashRedisCache({
    config: {
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_TOKEN,
    },
  });
}
