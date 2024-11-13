import * as defaults from './defaults';

export const deadLetterQueue = new sst.aws.Queue('DeadLetterQueue');
deadLetterQueue.subscribe({
  handler: 'apps/functions/src/queues/subscribers/dead-letter.handler',
  copyFiles: defaults.copyFiles,
  runtime: defaults.runtime,
  nodejs: defaults.nodejs,
  memory: defaults.memory,
  timeout: defaults.timeout,
  environment: defaults.environment,
  link: defaults.link,
});

export const indexBibleQueue = new sst.aws.Queue('IndexBibleQueue', {
  visibilityTimeout: '15 minutes',
  dlq: { queue: deadLetterQueue.arn, retry: 3 },
});
indexBibleQueue.subscribe(
  {
    handler: 'apps/functions/src/queues/subscribers/bibles/index-bible.handler',
    copyFiles: defaults.copyFiles,
    runtime: defaults.runtime,
    nodejs: {
      install: defaults.install.apply((install) => [...install, 'jsdom']),
      esbuild: defaults.esbuild.apply((esbuild) => ({ external: [...esbuild.external, 'jsdom'] })),
    },
    memory: '2 GB',
    timeout: '15 minutes',
    environment: defaults.environment,
    link: defaults.link,
  },
  {
    batch: { partialResponses: true },
    transform: { eventSourceMapping: { scalingConfig: { maximumConcurrency: 10 } } },
  },
);

export const indexBibleChapterQueue = new sst.aws.Queue('IndexBibleChapterQueue', {
  visibilityTimeout: '15 minutes',
  dlq: { queue: deadLetterQueue.arn, retry: 5 },
});
indexBibleChapterQueue.subscribe(
  {
    handler: 'apps/functions/src/queues/subscribers/bibles/index-chapter/index.handler',
    copyFiles: defaults.copyFiles,
    runtime: defaults.runtime,
    nodejs: defaults.nodejs,
    memory: '2 GB',
    timeout: '15 minutes',
    environment: defaults.environment,
    link: defaults.link,
  },
  {
    batch: { partialResponses: true },
    transform: { eventSourceMapping: { scalingConfig: { maximumConcurrency: 10 } } },
  },
);

export const profileImagesQueue = new sst.aws.Queue('ProfileImagesQueue', {
  dlq: { queue: deadLetterQueue.arn, retry: 3 },
});
profileImagesQueue.subscribe(
  {
    handler: 'apps/functions/src/queues/subscribers/profile-images.handler',
    copyFiles: defaults.copyFiles,
    runtime: defaults.runtime,
    nodejs: defaults.nodejs,
    memory: '2 GB',
    timeout: defaults.timeout,
    environment: defaults.environment,
    link: defaults.link,
  },
  { batch: { partialResponses: true } },
);

export const emailQueue = new sst.aws.Queue('EmailQueue', {
  dlq: { queue: deadLetterQueue.arn, retry: 3 },
});
emailQueue.subscribe(
  {
    handler: 'apps/functions/src/queues/subscribers/email/index.handler',
    copyFiles: defaults.copyFiles,
    runtime: defaults.runtime,
    nodejs: defaults.nodejs,
    memory: '2 GB',
    timeout: defaults.timeout,
    environment: defaults.environment,
    link: defaults.link,
  },
  { batch: { partialResponses: true } },
);
