// import whyIsNodeRunning from 'why-is-node-running'; // For debugging

export default $config({
  app: (input) => ({
    name: 'theaistudybible',
    protected: input.stage === 'production',
    removal: 'remove',
    home: 'aws',
    providers: {
      '@ediri/pulumi-fly': '0.1.18',
      '@pulumiverse/sentry': '0.0.9',
      '@upstash/pulumi': '0.3.14',
      'docker-build': '0.0.10',
      'pulumi-stripe': '0.0.24',
      aws: { version: '6.67.0', region: 'us-east-1' },
      turso: { version: '0.2.3', organization: process.env.TURSO_ORG! },
    },
  }),
  run: async () => {
    // For debugging
    // setInterval(() => whyIsNodeRunning(), 1000 * 60); // Log out active node handles every 60 seconds

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
