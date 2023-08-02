import { STATIC_ENV_VARS } from "@stacks";
import { Duration } from "aws-cdk-lib/core";
import { Queue, StackContext } from "sst/constructs";

export function Queues({ stack }: StackContext) {
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
          ...STATIC_ENV_VARS,
        },
        permissions: ["sqs"],
        nodejs: {
          install: ["@sparticuz/chromium"],
          esbuild: {
            external: ["@sparticuz/chromium"],
          },
        },
        reservedConcurrentExecutions: stack.stage !== "prod" ? 4 : 100,
        timeout: "15 minutes",
        memorySize: "2 GB",
      },
    },
  });

  return {
    webpageIndexQueue,
  };
}
