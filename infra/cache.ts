sst.Linkable.wrap(upstash.RedisDatabase, (resource) => ({
  properties: {
    restUrl: $interpolate`https://${resource.endpoint}`,
    restToken: resource.restToken,
    redisUrl: $interpolate`rediss://default:${resource.password}@${resource.endpoint}:${resource.port}`,
  },
}));

export const upstashRedis = new upstash.RedisDatabase('UpstashRedis', {
  databaseName: `${$app.name}-${$app.stage}`,
  region: 'us-east-1',
  tls: true,
  eviction: true,
  autoScale: true,
});
