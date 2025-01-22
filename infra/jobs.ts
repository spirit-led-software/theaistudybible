export const dailyDevotionJob = new sst.aws.Cron('DailyDevotionJob', {
  job: {
    handler: 'apps/functions/src/jobs/daily-devotion.handler',
    timeout: '15 minutes',
  },
  schedule: 'cron(0 12 * * ? *)', // 12pm UTC, 8am EST
});

export const cleanupSessionsJob = new sst.aws.Cron('CleanupSessionsJob', {
  job: {
    handler: 'apps/functions/src/jobs/cleanup-sessions.handler',
    timeout: '15 minutes',
  },
  schedule: 'cron(0 1 * * ? *)', // 1am UTC, 9am EST
});

export const cleanupBucketsJob = new sst.aws.Cron('CleanupBucketsJob', {
  job: {
    handler: 'apps/functions/src/jobs/cleanup-buckets.handler',
    timeout: '15 minutes',
  },
  schedule: 'cron(0 1 * * ? *)', // 1am UTC, 9am EST
});
