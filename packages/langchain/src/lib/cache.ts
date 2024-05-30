import { UpstashRedisCache } from '@langchain/community/caches/upstash_redis';
import { Resource } from 'sst';

export const llmCache = new UpstashRedisCache({
  config: {
    url: Resource.UpstashRedis.restUrl,
    token: Resource.UpstashRedis.restToken
  }
});
