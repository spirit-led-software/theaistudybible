import type { FlyRegion } from './types/fly.io';
import { isProd } from './utils/constants';

export let dbGroup: turso.Group | undefined;
export let dbGroupToken: $util.Output<sst.Secret> | undefined;
export let dbSchema: turso.Database | undefined;
export let db:
  | $util.Output<
      sst.Linkable<{
        name: string;
        url: string;
        token: string;
      }>
    >
  | turso.Database;

if ($dev && process.env.TURSO_DEV === 'true') {
  db = new sst.x.DevCommand('TursoDev', {
    dev: {
      title: 'Turso',
      command: 'turso dev --db-file .libsql.db --port 54321',
      autostart: true,
    },
  }).urn.apply(
    () =>
      new sst.Linkable('Database', {
        properties: { name: 'name', url: 'http://127.0.0.1:54321', token: '' },
      }),
  );
} else {
  dbGroup = isProd
    ? new turso.Group(
        'TursoGroup',
        {
          name: 'default',
          primary: 'iad' satisfies FlyRegion,
          locations: ['iad', 'fra'] satisfies FlyRegion[],
        },
        { retainOnDelete: true },
      )
    : turso.Group.get('TursoGroup', 'default', {}, { retainOnDelete: true });

  sst.Linkable.wrap(turso.Group, (resource) => ({
    properties: {
      name: resource.name,
      primary: resource.primary,
      locations: resource.locations,
    },
  }));

  dbGroupToken = turso
    .getGroupTokenOutput({ id: dbGroup.id })
    .apply(({ jwt }) => new sst.Secret('TursoGroupToken', jwt));

  sst.Linkable.wrap(turso.Database, (resource) => ({
    properties: {
      name: resource.name,
      url: $interpolate`https://${resource.database.hostname}`,
      token: turso.getDatabaseTokenOutput({ id: resource.id }).apply(({ jwt }) => jwt),
    },
  }));

  dbSchema = new turso.Database(
    'TursoDatabaseSchema',
    {
      name: `${$app.name}-${$app.stage}-schema`,
      group: dbGroup.name,
      isSchema: true,
    },
    { retainOnDelete: isProd },
  );

  db = new turso.Database(
    'SharedTursoDatabase',
    {
      name: `${$app.name}-${$app.stage}-shared`,
      group: dbGroup.name,
      schema: dbSchema.name,
    },
    { retainOnDelete: isProd },
  );
}

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
