import { isProd } from './constants';
import type { FlyRegion } from './types/fly.io';

let tursoGroup: turso.Group | undefined;
let tursoDb: turso.Database | undefined;
if (!$dev) {
  tursoGroup = isProd
    ? new turso.Group(
        'TursoGroup',
        {
          name: 'default',
          primary: 'iad' satisfies FlyRegion,
          locations: ['iad', 'sin'] satisfies FlyRegion[],
        },
        { retainOnDelete: true },
      )
    : turso.Group.get('TursoGroup', 'default', {}, { retainOnDelete: true });

  tursoDb = new turso.Database(
    'TursoDatabase',
    {
      name: `${$app.name}-${$app.stage}`,
      group: tursoGroup.name,
    },
    { retainOnDelete: isProd },
  );
}

export const database = new sst.Linkable('Database', {
  properties: {
    name: tursoDb?.name ?? 'dev',
    url: tursoDb
      ? $interpolate`https://${tursoDb.database.hostname}`
      : `file://${process.cwd()}/.libsql.db`,
    token: tursoDb ? turso.getDatabaseTokenOutput({ id: tursoDb.id }).apply(({ jwt }) => jwt) : '',
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
  region: 'global',
  primaryRegion: 'us-east-1',
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
