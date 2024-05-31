import { indexFileBucket, publicBucket } from "./buckets";
import { neonBranch, upstashRedis, upstashVector } from "./databases";
import { webpageScraperQueue } from "./queues";

export const chatApi = new sst.aws.Function("ChatAPIFunction", {
  handler: "apps/functions/src/chat.handler",
  memory: "2 GB",
  timeout: "5 minutes",
  live: false, // Can't do live dev with streaming
  streaming: true,
  url: true,
  link: [
    indexFileBucket,
    neonBranch,
    publicBucket,
    upstashRedis,
    upstashVector,
    webpageScraperQueue,
  ],
});
