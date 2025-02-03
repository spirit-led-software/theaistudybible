import {
  dataSourcesSyncQueue,
  deadLetterQueue,
  emailQueue,
  indexBibleChapterQueue,
  indexBibleQueue,
  indexDataSourceFilesQueue,
  profileImagesQueue,
} from './queues';

deadLetterQueue.subscribe({
  handler: 'apps/functions/src/queues/subscribers/dead-letter.handler',
});

emailQueue.subscribe(
  {
    handler: 'apps/functions/src/queues/subscribers/email.handler',
    memory: '2 GB',
  },
  { batch: { partialResponses: true } },
);

indexBibleQueue.subscribe(
  {
    handler: 'apps/functions/src/queues/subscribers/bibles/index-bible.handler',
    nodejs: { install: ['jsdom'], esbuild: { external: ['jsdom'] } },
    memory: '2 GB',
    timeout: '15 minutes',
  },
  {
    batch: { size: 1, partialResponses: true },
    transform: { eventSourceMapping: { scalingConfig: { maximumConcurrency: 5 } } },
  },
);

indexBibleChapterQueue.subscribe(
  {
    handler: 'apps/functions/src/queues/subscribers/bibles/index-chapter/index.handler',
    memory: '2 GB',
    timeout: '15 minutes',
  },
  {
    batch: { size: 1, partialResponses: true },
    transform: { eventSourceMapping: { scalingConfig: { maximumConcurrency: 10 } } },
  },
);

dataSourcesSyncQueue.subscribe(
  {
    handler: 'apps/functions/src/queues/subscribers/data-sources/index.handler',
    memory: '2 GB',
    timeout: '15 minutes',
  },
  { batch: { partialResponses: true } },
);

indexDataSourceFilesQueue.subscribe(
  {
    handler: 'apps/functions/src/queues/subscribers/data-sources/files.handler',
    memory: '2 GB',
    timeout: '15 minutes',
  },
  { batch: { size: 1, partialResponses: true } },
);

profileImagesQueue.subscribe(
  {
    handler: 'apps/functions/src/queues/subscribers/profile-images.handler',
    memory: '2 GB',
  },
  { batch: { size: 1, partialResponses: true } },
);
