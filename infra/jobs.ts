export const dailyDevotionJob = new sst.aws.Cron('DailyDevotionJob', {
  job: {
    handler: 'apps/functions/src/jobs/daily-devotion.handler',
  },
  schedule: 'cron(0 12 * * ? *)', // 12pm UTC, 8am EST
});
