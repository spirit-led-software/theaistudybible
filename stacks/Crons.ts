import { Constants, DatabaseScripts, S3, STATIC_ENV_VARS } from "@stacks";
import { Cron, StackContext, dependsOn, use } from "sst/constructs";

export function Crons({ stack }: StackContext) {
  dependsOn(DatabaseScripts);

  const { invokeBedrockPolicy } = use(Constants);
  const { devotionImageBucket } = use(S3);
  const {
    dbReadWriteUrl,
    dbReadOnlyUrl,
    vectorDbReadWriteUrl,
    vectorDbReadOnlyUrl,
  } = use(DatabaseScripts);

  const dailyDevotionCron = new Cron(stack, "dailyDevoCron", {
    schedule: "cron(0 12 * * ? *)",
    job: {
      function: {
        handler: "packages/functions/src/daily-devo.handler",
        bind: [devotionImageBucket],
        permissions: [devotionImageBucket, invokeBedrockPolicy],
        copyFiles: [
          {
            from: "firebase-service-account.json",
            to: "firebase-service-account.json",
          },
        ],
        environment: {
          DEVOTION_IMAGE_BUCKET: devotionImageBucket.bucketName,
          DATABASE_READWRITE_URL: dbReadWriteUrl,
          DATABASE_READONLY_URL: dbReadOnlyUrl,
          VECTOR_DB_READWRITE_URL: vectorDbReadWriteUrl,
          VECTOR_DB_READONLY_URL: vectorDbReadOnlyUrl,
          ...STATIC_ENV_VARS,
        },
        timeout: "5 minutes",
        memorySize: "1 GB",
      },
    },
  });

  return {
    dailyDevotionCron,
  };
}
