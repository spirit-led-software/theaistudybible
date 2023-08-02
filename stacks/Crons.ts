import { DatabaseScripts, STATIC_ENV_VARS } from "@stacks";
import { Cron, StackContext, dependsOn } from "sst/constructs";

export function Crons({ stack }: StackContext) {
  dependsOn(DatabaseScripts);

  const dailyDevotionCron = new Cron(stack, "dailyDevoCron", {
    schedule: "cron(0 10 * * ? *)",
    job: {
      function: {
        handler: "packages/functions/src/daily-devo.handler",
        environment: {
          ...STATIC_ENV_VARS,
        },
      },
    },
  });

  return {
    dailyDevotionCron,
  };
}
