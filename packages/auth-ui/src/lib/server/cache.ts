import { building } from '$app/environment';
import { UpstashRedisCache } from '@langchain/community/caches/upstash_redis';
import { Redis } from '@upstash/redis';
import { Config } from 'sst/node/config';

export let cache: Redis;
if (!building) {
	cache = new Redis({
		url: Config.UPSTASH_REDIS_REST_URL,
		token: Config.UPSTASH_REDIS_TOKEN
	});
}

export let llmCache: UpstashRedisCache;
if (!building) {
	llmCache = new UpstashRedisCache({
		config: {
			url: Config.UPSTASH_REDIS_REST_URL,
			token: Config.UPSTASH_REDIS_TOKEN
		}
	});
}
