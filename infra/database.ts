import { turso } from './resources';

let tursoGroup: turso.TursoGroup | undefined;
let tursoDb: turso.TursoDatabase | undefined;
if (!$dev) {
  tursoGroup = new turso.TursoGroup(
    'TursoGroup',
    {
      name: 'default', // This must be default if not on the "Scale" plan or above
      primaryLocation: 'atl',
      locations: ['lax', 'lhr'],
    },
    {
      retainOnDelete: true, // Other apps or stages may need to reference this
    },
  );
  tursoDb = new turso.TursoDatabase('TursoDatabase', {
    name: `${$app.name}-${$app.stage}`,
    group: tursoGroup.name,
  });
}

export const database = new sst.Linkable('Database', {
  properties: {
    name: tursoDb?.name ?? 'dev',
    url: tursoDb ? $interpolate`https://${tursoDb.hostname}` : `file://${process.cwd()}/.libsql.db`,
    token: tursoDb?.token ?? '',
  },
});

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

sst.Linkable.wrap(upstash.VectorIndex, (resource) => ({
  properties: {
    restUrl: $interpolate`https://${resource.endpoint}`,
    restToken: resource.token,
    readOnlyRestToken: resource.readOnlyToken,
  },
}));
export const upstashVectorIndex = new upstash.VectorIndex('UpstashVectorIndex', {
  name: `${$app.name}-${$app.stage}`,
  region: 'us-east-1',
  dimensionCount: $dev ? 1536 : 3072,
  similarityFunction: 'COSINE',
  type: 'payg',
});
