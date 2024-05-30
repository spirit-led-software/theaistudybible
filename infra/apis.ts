import { indexFileBucket, publicBucket } from "./buckets";
import { domainName } from "./constants";
import { neonBranch, upstashRedis, upstashVector } from "./databases";
import { chromiumLayer } from "./layers";
import { webpageScraperQueue } from "./queues";

export const chatApi = new sst.aws.Function("ChatAPIFunction", {
  handler: "apps/functions/src/chat.handler",
  memory: "2 GB",
  timeout: "5 minutes",
  live: false, // Can't do live dev with streaming
  streaming: true,
  url: {
    cors: true,
  },
  link: [
    indexFileBucket,
    neonBranch,
    publicBucket,
    upstashRedis,
    upstashVector,
    webpageScraperQueue,
  ],
});

export const api = new sst.aws.Function("APIFunction", {
  handler: "apps/api/src/index.handler",
  layers: [chromiumLayer.arn],
  timeout: "5 minutes",
  url: {
    cors: true,
  },
  link: [
    chatApi,
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
    "/chat": chatApi.url,
  },
});
