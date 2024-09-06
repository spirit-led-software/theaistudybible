export default $config({
  app: (input) => {
    return {
      name: 'theaistudybible',
      removal: input?.stage === 'production' ? 'retain' : 'remove',
      home: 'aws',
      providers: {
        aws: true,
        cloudflare: true,
        '@upstash/pulumi': true,
      },
    };
  },
  run: async () => {
    await import('./infra/defaults');
    await import('./infra/constants');
    await import('./infra/secrets');
    const { database, upstashVectorIndex } = await import('./infra/database');
    const { upstashRedis } = await import('./infra/cache');
    const { cdn } = await import('./infra/storage');
    const { webapp } = await import('./infra/www');
    await import('./infra/dev');

    return {
      'Database URL': database.properties.url,
      'Vector Store Endpoint': upstashVectorIndex.endpoint,
      'Redis Endpoint': upstashRedis.endpoint,
      'CDN URL': cdn.url,
      'Web App URL': webapp.url,
    };
  },
});
