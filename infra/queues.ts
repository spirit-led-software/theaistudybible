import { neonBranch, upstashRedis, upstashVector } from "./databases";
import { chromiumLayer } from "./layers";

export const webpageScraperQueue = new sst.aws.Queue("WebpageScraperQueue", {
  transform: {
    queue: {
      messageRetentionSeconds: 60 * 60 * 24,
      visibilityTimeoutSeconds: 60 * 15,
    },
  },
});
webpageScraperQueue.subscribe(
  {
    handler: "apps/functions/src/scraper/webpage-queue.handler",
    architecture: "x86_64",
    runtime: "nodejs18.x",
    link: [neonBranch, upstashVector, upstashRedis],
    layers: [chromiumLayer.arn],
    timeout: "15 minutes",
    memory: "2 GB",
  },
  {
    transform: {
      eventSourceMapping: {
        batchSize: 1,
        scalingConfig: {
          maximumConcurrency: $app.stage !== "prod" ? 2 : 25,
        },
      },
    },
  }
);
