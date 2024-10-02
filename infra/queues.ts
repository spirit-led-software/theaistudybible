export const indexBibleQueue = new sst.aws.Queue('IndexBibleQueue', {
  visibilityTimeout: '15 minutes',
});
indexBibleQueue.subscribe(
  {
    handler: 'apps/functions/src/queues/subscribers/bibles/index-bible.handler',
    nodejs: {
      install: ['jsdom'],
    },
    timeout: '15 minutes',
  },
  {
    batch: { partialResponses: true },
    transform: { eventSourceMapping: { scalingConfig: { maximumConcurrency: 10 } } },
  },
);

export const indexBibleChapterQueue = new sst.aws.Queue('IndexBibleChapterQueue', {
  visibilityTimeout: '15 minutes',
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

export const profileImagesQueue = new sst.aws.Queue('ProfileImagesQueue');
profileImagesQueue.subscribe(
  {
    handler: 'apps/functions/src/queues/subscribers/profile-images.handler',
  },
  {
    batch: { partialResponses: true },
  },
);

export const emailQueue = new sst.aws.Queue('EmailQueue');
emailQueue.subscribe(
  {
    handler: 'apps/functions/src/queues/subscribers/email/index.handler',
  },
  {
    batch: { partialResponses: true },
  },
);
