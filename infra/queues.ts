export const indexBibleQueue = new sst.aws.Queue('IndexBibleQueue');
indexBibleQueue.subscribe(
  {
    handler: 'apps/functions/src/queues/subscribers/bibles/index-bible.handler',
  },
  {
    batch: {
      size: 1,
    },
  },
);

export const indexBibleChapterQueue = new sst.aws.Queue('IndexBibleChapterQueue');
indexBibleChapterQueue.subscribe(
  {
    handler: 'apps/functions/src/queues/subscribers/bibles/index-chapter/index.handler',
  },
  {
    batch: {
      size: 1,
    },
  },
);

export const profileImagesQueue = new sst.aws.Queue('ProfileImagesQueue');
profileImagesQueue.subscribe({
  handler: 'apps/functions/src/queues/subscribers/profile-images.handler',
});

export const emailQueue = new sst.aws.Queue('EmailQueue', {
  fifo: true,
});
emailQueue.subscribe({
  handler: 'apps/functions/src/queues/subscribers/email/index.handler',
});
