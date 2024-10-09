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
      '@pulumiverse/sentry': true,
      tls: true,
      '@upstash/pulumi': true,
    },
  }),
  run: async () => {
    await import('./infra/defaults');
    const { DOMAIN } = await import('./infra/constants');
    await import('./infra/secrets');
    await import('./infra/storage');
    const { cdn } = await import('./infra/cdn');
    const { database, upstashVectorIndex, upstashRedis } = await import('./infra/database');
    await import('./infra/email');
    await import('./infra/queues');
    const { webhooksApi } = await import('./infra/webhooks');
    await import('./infra/jobs');
    await import('./infra/monitoring');
    await import('./infra/www');
    const { vps } = await import('./infra/vps');
    await import('./infra/dev');

    const dbMigrateCmd = new command.local.Command(
      'DbMigrate',
      {
        dir: process.cwd(),
        create: 'bun run db:migrate',
        update: 'bun run db:migrate',
        triggers: [Date.now()],
      },
      { dependsOn: [database] },
    );
    new command.local.Command(
      'DbSeed',
      {
        dir: process.cwd(),
        create: 'bun run db:seed',
        update: 'bun run db:seed',
        triggers: [Date.now()],
      },
      { dependsOn: [dbMigrateCmd] },
    );

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
