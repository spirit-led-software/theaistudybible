import constants from './constants';
import { database } from './database';
import secrets from './secrets';
import { devotionImagesBucket } from './storage';

export const dailyDevotionJob = new sst.aws.Cron('DailyDevotionJob', {
  job: {
    handler: 'apps/functions/src/jobs/daily-devotion.handler',
    link: [...constants, ...secrets, database, devotionImagesBucket],
  },
  schedule: 'cron(0 12 * * ? *)', // 12pm UTC, 8am EST
});
