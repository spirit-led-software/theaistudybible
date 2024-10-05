export const deadLetterQueue = new sst.aws.Queue('DeadLetterQueue');
deadLetterQueue.subscribe('apps/functions/src/queues/subscribers/dead-letter.handler', {
  transform: { eventSourceMapping: { maximumRetryAttempts: 3 } },
});

export const indexBibleQueue = new sst.aws.Queue('IndexBibleQueue', {
  visibilityTimeout: '15 minutes',
  dlq: { queue: deadLetterQueue.arn, retry: 3 },
});
indexBibleQueue.subscribe(
  {
    handler: 'apps/functions/src/queues/subscribers/bibles/index-bible.handler',
    nodejs: { install: ['jsdom'] },
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
profileImagesQueue.subscribe('apps/functions/src/queues/subscribers/profile-images.handler', {
  batch: { partialResponses: true },
});

export const emailQueue = new sst.aws.Queue('EmailQueue', {
  dlq: { queue: deadLetterQueue.arn, retry: 3 },
});
emailQueue.subscribe('apps/functions/src/queues/subscribers/email/index.handler', {
  batch: { partialResponses: true },
});
