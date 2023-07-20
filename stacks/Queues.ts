import { Database, Layers, STATIC_ENV_VARS } from "@stacks";
import { Queue, StackContext, use } from "sst/constructs";

export function Queues({ stack, app }: StackContext) {
  const { database } = use(Database);
  const { chromiumLayer } = use(Layers);

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
        runtime: "nodejs18.x",
        nodejs: {
          esbuild: {
            external: ["@sparticuz/chromium"],
          },
        },
        permissions: ["sqs"],
        layers: [chromiumLayer],
        reservedConcurrentExecutions:
          stack.stage !== "prod" && app.mode === "dev" ? 4 : 20,
        timeout: "90 seconds",
      },
    },
  });

  return {
    webpageIndexQueue,
  };
}
