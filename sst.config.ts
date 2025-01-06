export default $config({
  app: () => ({
    name: 'theaistudybible',
    removal: 'remove',
    home: 'aws',
    providers: {
      '@pulumiverse/sentry': '0.0.9',
      '@upstash/pulumi': '0.3.14',
      'docker-build': '0.0.8',
      'pulumi-stripe': '0.0.24',
      aws: { version: '6.66.2', region: 'us-east-1' },
      turso: { version: '0.2.3', organization: process.env.TURSO_ORG! },
    },
  }),
  run: async () => {
    // Linkable resources
    const { WEBAPP_URL } = await import('./infra/constants');
    await import('./infra/secrets');
    await import('./infra/monitoring');
    await import('./infra/analytics');
    await import('./infra/storage');
    await import('./infra/database');
    await import('./infra/email');
    await import('./infra/queues');

    // Setup default links, etc
    await import('./infra/defaults');

    await import('./infra/queue-subscribers');
    await import('./infra/webhooks');
    await import('./infra/jobs');
    await import('./infra/www');
    await import('./infra/dev');

    return { 'Web App URL': WEBAPP_URL.value };
  },
});
