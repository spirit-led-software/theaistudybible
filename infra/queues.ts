import * as defaults from './defaults';
import { deadLetterQueue } from './dlq';

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
