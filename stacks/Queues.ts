import { Database, STATIC_ENV_VARS } from "@stacks";
import { Duration } from "aws-cdk-lib/core";
import { Queue, StackContext, use } from "sst/constructs";

export function Queues({ stack, app }: StackContext) {
  const { database } = use(Database);

  const webpageIndexQueue = new Queue(stack, "webpageIndexQueue", {
    cdk: {
      queue: {
        visibilityTimeout: Duration.minutes(1),
      },
    },
    consumer: {
      function: {
        handler: "packages/functions/src/scraper/webpage-queue.consumer",
        environment: {
          DATABASE_RESOURCE_ARN: database.clusterArn,
          DATABASE_SECRET_ARN: database.secretArn,
          DATABASE_NAME: database.defaultDatabaseName,
          ...STATIC_ENV_VARS,
        },
        bind: [database],
        permissions: ["sqs"],
        nodejs: {
          install: ["@sparticuz/chromium"],
          esbuild: {
            external: ["@sparticuz/chromium"],
          },
        },
        reservedConcurrentExecutions: stack.stage !== "prod" ? 4 : 20,
        timeout: "1 minute",
      },
    },
  });

  return {
    webpageIndexQueue,
  };
}
