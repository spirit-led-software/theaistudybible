import { UpstashRedisCache } from '@langchain/community/caches/upstash_redis';
import { Config } from 'sst/node/config';

export const llmCache = new UpstashRedisCache({
  config: {
    url: Config.UPSTASH_REDIS_REST_URL,
    token: Config.UPSTASH_REDIS_TOKEN
  }
});
