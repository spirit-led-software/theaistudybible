import { Queue as QueueConstruct, StackContext, use } from "sst/constructs";
import { STATIC_ENV_VARS } from ".";
import { Database } from "./Database";

export function Queue({ stack }: StackContext) {
  const { database } = use(Database);

  const webpageIndexQueue = new QueueConstruct(stack, "WebpageIndexQueue", {
    consumer: {
      function: {
        handler: "packages/functions/src/scraper/webpage-queue.consumer",
        environment: {
          DATABASE_RESOURCE_ARN: database.clusterArn,
          DATABASE_SECRET_ARN: database.secretArn,
          DATABASE_NAME: database.defaultDatabaseName,
          ...STATIC_ENV_VARS,
        },
      },
    },
  });

  return {
    webpageIndexQueue,
  };
}
