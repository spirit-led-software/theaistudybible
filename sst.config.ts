export default $config({
  app: (input) => {
    return {
      name: 'theaistudybible',
      removal: input?.stage === 'production' ? 'retain' : 'remove',
      home: 'aws',
      providers: {
        aws: {
          region: 'us-east-1',
        },
        cloudflare: true,
        'pulumi-stripe': true,
        '@pulumiverse/sentry': true,
        '@upstash/pulumi': true,
      },
    };
  },
  run: async () => {
    await import('./infra/defaults');
    await import('./infra/constants');
    await import('./infra/secrets');
    const { database, upstashVectorIndex, upstashRedis } = await import('./infra/database');
    const { cdn } = await import('./infra/storage');
    await import('./infra/queues');
    const { webhooksApi } = await import('./infra/webhooks');
    await import('./infra/email');
    await import('./infra/monitoring');
    const { webapp } = await import('./infra/www');
    await import('./infra/jobs');
    await import('./infra/dev');

    return {
      'CDN URL': cdn.url,
      'Database URL': database.properties.url,
      'Redis Endpoint': upstashRedis.endpoint,
      'Vector Store Endpoint': upstashVectorIndex.endpoint,
      'Web App URL': webapp.url,
      'Webhooks API URL': webhooksApi.properties.url,
    };
  },
});
