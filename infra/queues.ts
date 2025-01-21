export const deadLetterQueue = new sst.aws.Queue('DeadLetterQueue');

export const emailQueue = new sst.aws.Queue('EmailQueue', {
  dlq: { queue: deadLetterQueue.arn, retry: 3 },
});

export const indexBibleQueue = new sst.aws.Queue('IndexBibleQueue', {
  visibilityTimeout: '15 minutes',
  dlq: { queue: deadLetterQueue.arn, retry: 3 },
});

export const indexBibleChapterQueue = new sst.aws.Queue('IndexBibleChapterQueue', {
  visibilityTimeout: '15 minutes',
  dlq: { queue: deadLetterQueue.arn, retry: 5 },
});

export const indexDataSourceFilesQueue = new sst.aws.Queue('IndexDataSourceFilesQueue', {
  visibilityTimeout: '15 minutes',
  dlq: { queue: deadLetterQueue.arn, retry: 3 },
});

export const profileImagesQueue = new sst.aws.Queue('ProfileImagesQueue', {
  dlq: { queue: deadLetterQueue.arn, retry: 3 },
});
