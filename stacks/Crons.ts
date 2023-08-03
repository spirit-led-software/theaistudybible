import { DatabaseScripts, S3, STATIC_ENV_VARS } from "@stacks";
import { Cron, StackContext, dependsOn, use } from "sst/constructs";

export function Crons({ stack }: StackContext) {
  dependsOn(DatabaseScripts);

  const { devotionImageBucket } = use(S3);

  const dailyDevotionCron = new Cron(stack, "dailyDevoCron", {
    schedule: "cron(0 10 * * ? *)",
    job: {
      function: {
        handler: "packages/functions/src/daily-devo.handler",
        environment: {
          DEVOTION_IMAGE_BUCKET: devotionImageBucket.bucketName,
          ...STATIC_ENV_VARS,
        },
      },
    },
  });

  return {
    dailyDevotionCron,
  };
}
