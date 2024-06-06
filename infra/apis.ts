import { indexFileBucket, publicBucket } from "./buckets";
import { domainName } from "./constants";
import { neonBranch, upstashRedis, upstashVector } from "./databases";
import { webpageScraperQueue } from "./queues";

export const api = new sst.aws.Function("APIFunction", {
  handler: "apps/api/src/index.handler",
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

export const apiRouter = new sst.aws.Router("APIRouter", {
  domain: `api.${domainName}`,
  routes: {
    "/*": api.url,
  },
});
