export const dailyDevotionJob = new sst.aws.Cron('DailyDevotionJob', {
  job: {
    handler: 'apps/functions/src/jobs/daily-devotion.handler',
    timeout: '15 minutes',
  },
  schedule: 'cron(0 12 * * ? *)', // 12pm UTC, 8am EST
});

export const addCreditsJob = new sst.aws.Cron('AddCreditsJob', {
  job: {
    handler: 'apps/functions/src/jobs/add-credits.handler',
    timeout: '15 minutes',
  },
  schedule: 'cron(0 0 * * ? *)', // 12am UTC, 8am EST
});
