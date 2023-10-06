import { Database, STATIC_ENV_VARS } from "@stacks";
import { Duration } from "aws-cdk-lib/core";
import { Queue, StackContext, dependsOn, use } from "sst/constructs";

export function Queues({ stack }: StackContext) {
  dependsOn(Database);

  const {
    dbReadWriteUrl,
    dbReadOnlyUrl,
    vectorDbReadWriteUrl,
    vectorDbReadOnlyUrl,
  } = use(Database);

  const webpageIndexQueue = new Queue(stack, "webpageIndexQueue", {
    cdk: {
      queue: {
        visibilityTimeout: Duration.minutes(15),
      },
    },
    consumer: {
      function: {
        handler: "packages/functions/src/scraper/webpage-queue.consumer",
        environment: {
          DATABASE_READWRITE_URL: dbReadWriteUrl,
          DATABASE_READONLY_URL: dbReadOnlyUrl,
          VECTOR_DB_READWRITE_URL: vectorDbReadWriteUrl,
          VECTOR_DB_READONLY_URL: vectorDbReadOnlyUrl,
          ...STATIC_ENV_VARS,
        },
        permissions: ["sqs"],
        nodejs: {
          install: ["@sparticuz/chromium"],
          esbuild: {
            external: ["@sparticuz/chromium"],
          },
        },
        reservedConcurrentExecutions: stack.stage !== "prod" ? 4 : 20,
        timeout: "15 minutes",
        memorySize: "2 GB",
      },
    },
  });

  return {
    webpageIndexQueue,
  };
}
