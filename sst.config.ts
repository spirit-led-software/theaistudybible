// import whyIsNodeRunning from 'why-is-node-running'; // For debugging

export default $config({
  app: (input) => ({
    name: 'theaistudybible',
    protected: input.stage === 'production',
    removal: 'remove',
    home: 'aws',
    providers: {
      '@ediri/pulumi-fly': true,
      '@pulumiverse/sentry': true,
      '@upstash/pulumi': true,
      'docker-build': true,
      'pulumi-stripe': true,
      aws: { region: 'us-east-1' },
      turso: { organization: process.env.TURSO_ORG! },
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
