import { turso } from './resources';

let tursoGroup: turso.TursoGroup | undefined = undefined;
let tursoDb: turso.TursoDatabase | undefined = undefined;
if (!$dev) {
  tursoGroup = new turso.TursoGroup('TursoGroup', {
    name: 'default', // This must be default if not on the "Scale" plan or above
    primaryLocation: 'atl',
    locations: ['lax', 'lhr'],
  });
  tursoDb = new turso.TursoDatabase('TursoDatabase', {
    name: `${$app.name}-${$app.stage}`,
    group: tursoGroup.name,
  });
}

export const database = new sst.Linkable('Database', {
  properties: {
    name: tursoDb?.name ?? 'local',
    url: tursoDb?.hostname
      ? $interpolate`libsql://${tursoDb.hostname}`
      : `file://${process.cwd()}/.libsql.db`,
    token: tursoDb?.token ?? '',
  },
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
