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
        '@upstash/pulumi': true,
      },
    };
  },
  console: {
    autodeploy: {
      target: (event) => {
        if (event.type === 'branch' && event.branch === 'master' && event.action === 'pushed') {
          return {
            stage: 'production',
            runner: {
              engine: 'codebuild',
              architecture: 'arm64',
              compute: 'small',
            },
          };
        }
      },
    },
  },
  run: async () => {
    await import('./infra/email');
    await import('./infra/defaults');
    await import('./infra/constants');
    await import('./infra/secrets');
    const { database, upstashVectorIndex, upstashRedis } = await import('./infra/database');
    const { cdn } = await import('./infra/storage');
    const { webhooksApi } = await import('./infra/api');
    const { webapp } = await import('./infra/www');
    await import('./infra/jobs');
    await import('./infra/dev');

    return {
      'Database URL': database.properties.url,
      'Vector Store Endpoint': upstashVectorIndex.endpoint,
      'Redis Endpoint': upstashRedis.endpoint,
      'CDN URL': cdn.url,
      'Web App URL': webapp.url,
      'Webhooks API URL': webhooksApi.properties.url,
    };
  },
});
