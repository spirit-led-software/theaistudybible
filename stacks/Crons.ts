import { Database, STATIC_ENV_VARS } from "@stacks";
import { Cron, StackContext, use } from "sst/constructs";

export function Crons({ stack }: StackContext) {
  const { database } = use(Database);

  const dailyDevotionCron = new Cron(stack, "DailyDevotionCron", {
    schedule: "cron(0 0 * * ? *)",
    job: {
      function: {
        handler: "src/functions/src/daily-devo.handler",
        environment: {
          ...STATIC_ENV_VARS,
        },
        bind: [database],
        permissions: [database],
      },
    },
  });

  return {
    dailyDevotionCron,
  };
}
