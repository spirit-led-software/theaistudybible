import * as defaults from './defaults';

export const dailyDevotionJob = new sst.aws.Cron('DailyDevotionJob', {
  job: {
    handler: 'apps/functions/src/jobs/daily-devotion.handler',
    copyFiles: defaults.copyFiles,
    runtime: defaults.runtime,
    nodejs: { install: defaults.install, esbuild: { external: defaults.external } },
    link: defaults.link,
    environment: defaults.environment,
    memory: defaults.memory,
    timeout: '15 minutes',
  },
  schedule: 'cron(0 12 * * ? *)', // 12pm UTC, 8am EST
});
