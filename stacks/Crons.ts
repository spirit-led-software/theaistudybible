import { STATIC_ENV_VARS } from "@stacks";
import { Cron, StackContext } from "sst/constructs";

export function Crons({ stack }: StackContext) {
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
