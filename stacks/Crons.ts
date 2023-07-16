import { STATIC_ENV_VARS, Website } from "@stacks";
import { Cron, StackContext, use } from "sst/constructs";

export function Crons({ stack }: StackContext) {
  const { website } = use(Website);

  const dailyDevotionCron = new Cron(stack, "DailyDevotionCron", {
    schedule: "cron(0 0 * * ? *)",
    job: {
      function: {
        handler: "src/functions/src/daily-devo.handler",
        environment: {
          WEBSITE_URL: website.url!,
          ...STATIC_ENV_VARS,
        },
        bind: [website],
      },
    },
  });

  return {
    dailyDevotionCron,
  };
}
