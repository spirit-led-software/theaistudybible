export default $config({
  app: () => ({
    name: 'theaistudybible',
    removal: 'remove',
    home: 'aws',
    providers: {
      '@pulumiverse/sentry': true,
      '@upstash/pulumi': true,
      'docker-build': true,
      'pulumi-stripe': true,
      aws: { region: 'us-east-1' },
      cloudflare: true,
      fly: true,
      hcloud: true,
      tls: true,
      turso: { organization: 'ian-pascoe' },
    },
  }),
  run: async () => {
    await import('./infra/defaults');
    const { WEBAPP_URL } = await import('./infra/constants');
    await import('./infra/secrets');
    await import('./infra/monitoring');
    await import('./infra/storage');
    const { cdn } = await import('./infra/cdn');
    const { database, upstashVectorIndex, upstashRedis } = await import('./infra/database');
    await import('./infra/email');
    await import('./infra/queues');
    const { webhooksApi } = await import('./infra/webhooks');
    await import('./infra/jobs');
    await import('./infra/www');
    await import('./infra/fly.io');
    await import('./infra/dev');

    return {
      'CDN URL': cdn.url,
      'Database URL': database.properties.url,
      'Redis Endpoint': upstashRedis.endpoint,
      'Vector Store Endpoint': upstashVectorIndex.endpoint,
      'Web App URL': WEBAPP_URL.value,
      'Webhooks API URL': webhooksApi.properties.url,
    };
  },
});
