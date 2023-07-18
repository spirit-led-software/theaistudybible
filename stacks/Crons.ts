import { Database, STATIC_ENV_VARS } from "@stacks";
import { Cron, StackContext, use } from "sst/constructs";

export function Crons({ stack }: StackContext) {
  const { database } = use(Database);

  const dailyDevotionCron = new Cron(stack, "dailyDevoCron", {
    schedule: "cron(0 10 * * ? *)",
    job: {
      function: {
        handler: "packages/functions/src/daily-devo.handler",
        environment: {
          DATABASE_RESOURCE_ARN: database.clusterArn,
          DATABASE_SECRET_ARN: database.secretArn,
          DATABASE_NAME: database.defaultDatabaseName,
          ...STATIC_ENV_VARS,
        },
        bind: [database],
      },
    },
  });

  return {
    dailyDevotionCron,
  };
}
