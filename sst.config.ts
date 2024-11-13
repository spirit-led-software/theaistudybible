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
      command: true,
      turso: { organization: 'ian-pascoe' },
    },
  }),
  run: async () => {
    const { WEBAPP_URL } = await import('./infra/constants');
    await import('./infra/secrets');
    await import('./infra/monitoring');
    await import('./infra/analytics');
    await import('./infra/storage');
    await import('./infra/database');
    await import('./infra/dlq');
    await import('./infra/email');
    await import('./infra/defaults');
    await import('./infra/queues');
    await import('./infra/webhooks');
    await import('./infra/jobs');
    await import('./infra/www');
    await import('./infra/dev');

    return { 'Web App URL': WEBAPP_URL.value };
  },
});
