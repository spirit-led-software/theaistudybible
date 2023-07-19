import { Database, STATIC_ENV_VARS } from "@stacks";
import { Queue, StackContext, use } from "sst/constructs";

export function Queues({ stack, app }: StackContext) {
  const { database } = use(Database);

  const webpageIndexQueue = new Queue(stack, "webpageIndexQueue", {
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
        reservedConcurrentExecutions:
          stack.stage !== "prod" && app.mode === "dev" ? 4 : undefined,
        timeout: "90 seconds",
      },
    },
  });

  return {
    webpageIndexQueue,
  };
}
