import type { FlyRegion } from './types/fly.io';
import { isProd } from './utils/constants';

function getDatabase() {
  if ($dev) {
    const tursoDevCmd = new sst.x.DevCommand('TursoDev', {
      dev: {
        title: 'Turso',
        command: 'turso dev --db-file .libsql.db --port 54321',
        autostart: true,
      },
    });
    return new sst.Linkable('Database', {
      properties: {
        // This is how we get the linkable to depend on the dev command
        name: tursoDevCmd.urn.apply(() => 'name'),
        url: tursoDevCmd.urn.apply(() => 'http://127.0.0.1:54321'),
        token: tursoDevCmd.urn.apply(() => ''),
      },
    });
  }
  const tursoGroup = isProd
    ? new turso.Group(
        'TursoGroup',
        {
          name: 'default',
          primary: 'iad' satisfies FlyRegion,
          locations: ['iad', 'fra', 'sin'] satisfies FlyRegion[],
        },
        { retainOnDelete: true },
      )
    : turso.Group.get('TursoGroup', 'default', {}, { retainOnDelete: true });

  const tursoDatabase = new turso.Database(
    'TursoDatabase',
    {
      name: `${$app.name}-${$app.stage}`,
      group: tursoGroup.name,
    },
    { retainOnDelete: isProd },
  );

  return new sst.Linkable('Database', {
    properties: {
      name: tursoDatabase.name,
      url: $interpolate`https://${tursoDatabase.database.hostname}`,
      token: turso.getDatabaseTokenOutput({ id: tursoDatabase.id }).apply(({ jwt }) => jwt),
    },
  });
}

export const database = getDatabase();

sst.Linkable.wrap(upstash.RedisDatabase, (resource) => ({
  properties: {
    restUrl: $interpolate`https://${resource.endpoint}`,
    restToken: resource.restToken,
    redisUrl: $interpolate`rediss://default:${resource.password}@${resource.endpoint}:${resource.port}`,
  },
}));
export const upstashRedis = new upstash.RedisDatabase(
  'UpstashRedis',
  {
    databaseName: `${$app.name}-${$app.stage}`,
    region: 'global',
    primaryRegion: 'us-east-1',
    tls: true,
    eviction: true,
    autoScale: true,
  },
  { retainOnDelete: isProd },
);

sst.Linkable.wrap(upstash.VectorIndex, (resource) => ({
  properties: {
    restUrl: $interpolate`https://${resource.endpoint}`,
    restToken: resource.token,
    readOnlyRestToken: resource.readOnlyToken,
  },
}));
export const upstashVectorIndex = new upstash.VectorIndex(
  'UpstashVectorIndex',
  {
    name: `${$app.name}-${$app.stage}`,
    region: 'eu-west-1',
    dimensionCount: 1536,
    similarityFunction: 'COSINE',
    type: 'payg',
  },
  { retainOnDelete: isProd },
);
