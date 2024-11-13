import * as defaults from './defaults';

export const deadLetterQueue = new sst.aws.Queue('DeadLetterQueue');
deadLetterQueue.subscribe({
  handler: 'apps/functions/src/queues/subscribers/dead-letter.handler',
  copyFiles: defaults.copyFiles,
  runtime: defaults.runtime,
  nodejs: { install: defaults.install, esbuild: { external: defaults.external } },
  link: defaults.link,
  environment: defaults.environment,
  memory: defaults.memory,
  timeout: defaults.timeout,
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
      install: [...defaults.install, 'jsdom'],
      esbuild: { external: [...defaults.external, 'jsdom'] },
    },
    link: defaults.link,
    environment: defaults.environment,
    memory: '2 GB',
    timeout: '15 minutes',
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
    nodejs: { install: defaults.install, esbuild: { external: defaults.external } },
    link: defaults.link,
    environment: defaults.environment,
    memory: '2 GB',
    timeout: '15 minutes',
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
    nodejs: { install: defaults.install, esbuild: { external: defaults.external } },
    link: defaults.link,
    environment: defaults.environment,
    memory: '2 GB',
    timeout: defaults.timeout,
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
    nodejs: { install: defaults.install, esbuild: { external: defaults.external } },
    link: defaults.link,
    environment: defaults.environment,
    memory: '2 GB',
    timeout: defaults.timeout,
  },
  { batch: { partialResponses: true } },
);
