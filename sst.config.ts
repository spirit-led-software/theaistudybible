export default $config({
  app: (input) => ({
    name: 'theaistudybible',
    removal: input.stage === 'production' ? 'retain' : 'remove',
    home: 'aws',
    providers: {
      '@pulumiverse/sentry': true,
      '@upstash/pulumi': true,
      'docker-build': true,
      'pulumi-stripe': true,
      aws: { region: 'us-east-1' },
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
