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
      docker: true,
      'docker-build': true,
      hcloud: true,
      'pulumi-stripe': true,
      '@pulumiverse/sentry': true,
      tls: true,
      '@upstash/pulumi': true,
    },
  }),
  run: async () => {
    await import('./infra/defaults');
    const { DOMAIN } = await import('./infra/constants');
    await import('./infra/secrets');
    const { database, upstashVectorIndex, upstashRedis } = await import('./infra/database');
    await import('./infra/queues');
    const { webhooksApi } = await import('./infra/webhooks');
    await import('./infra/email');
    await import('./infra/monitoring');
    await import('./infra/jobs');
    const { cdn } = await import('./infra/cdn');
    const { vps } = await import('./infra/vps');
    await import('./infra/www');
    await import('./infra/dev');

    return {
      'CDN URL': cdn.url,
      'Database URL': database.properties.url,
      'Redis Endpoint': upstashRedis.endpoint,
      'Vector Store Endpoint': upstashVectorIndex.endpoint,
      'Web App URL': vps ? `https://${DOMAIN.value}` : 'Not available in dev',
      'Webhooks API URL': webhooksApi.properties.url,
    };
  },
});
