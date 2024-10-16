export default $config({
  app: () => ({
    name: 'theaistudybible',
    removal: 'remove',
    home: 'aws',
    providers: {
      aws: {
        region: 'us-east-1',
      },
      cloudflare: true,
      command: true,
      docker: true,
      'docker-build': true,
      hcloud: true,
      'pulumi-stripe': true,
      tls: true,
      '@upstash/pulumi': true,
    },
  }),
  run: async () => {
    await import('./infra/defaults');
    const { WEBAPP_URL } = await import('./infra/constants');
    await import('./infra/secrets');
    await import('./infra/storage');
    const { cdn } = await import('./infra/cdn');
    const { database, upstashVectorIndex, upstashRedis } = await import('./infra/database');
    await import('./infra/email');
    await import('./infra/queues');
    const { webhooksApi } = await import('./infra/webhooks');
    await import('./infra/jobs');
    await import('./infra/www');
    await import('./infra/vps');
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
