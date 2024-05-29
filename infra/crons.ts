import { neonBranch, upstashRedis, upstashVector } from "./databases";
import { chromiumLayer } from "./layers";

if ($app.stage === "prod") {
  new sst.aws.Cron("DailyDevoCron", {
    schedule: "cron(0 13 * * ? *)",
    job: {
      handler: "apps/functions/src/crons/daily-devo.handler",
      link: [neonBranch, upstashVector, upstashRedis],
      copyFiles: [
        {
          from: "firebase-service-account.json",
          to: "firebase-service-account.json",
        },
      ],
      timeout: "5 minutes",
      memory: "2 GB",
    },
  });

  new sst.aws.Cron("DailyQueryCron", {
    schedule: "cron(0 23 * * ? *)",
    job: {
      handler: "apps/functions/src/crons/daily-query.handler",
      link: [neonBranch, upstashVector, upstashRedis],
      copyFiles: [
        {
          from: "firebase-service-account.json",
          to: "firebase-service-account.json",
        },
      ],
      timeout: "5 minutes",
      memory: "2 GB",
    },
  });

  new sst.aws.Cron("IndexOpCleanupCron", {
    schedule: "cron(0 1 * * ? *)",
    job: {
      handler: "apps/functions/src/crons/index-op-cleanup.handler",
      link: [neonBranch, upstashVector, upstashRedis],
      timeout: "15 minutes",
      memory: "1 GB",
    },
  });

  new sst.aws.Cron("DataSourceSyncCron", {
    schedule: "cron(0 2 * * ? *)",
    job: {
      handler: "apps/functions/src/crons/data-source-sync.handler",
      link: [neonBranch, upstashVector, upstashRedis],
      architecture: "x86_64",
      runtime: "nodejs18.x",
      layers: [chromiumLayer.arn],
      memory: "2 GB",
      timeout: "15 minutes",
    },
  });
}
