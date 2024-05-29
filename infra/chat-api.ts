import { websiteUrl } from "./constants";
import { neonBranch, upstashRedis, upstashVector } from "./databases";

export const chatApiFunction = new sst.aws.Function("ChatApiFunction", {
  handler: "apps/functions/src/chat.handler",
  link: [neonBranch, upstashVector, upstashRedis],
  memory: "3 GB",
  timeout: "5 minutes",
  live: false, // Can't do live dev with streaming
  streaming: true,
  url: {
    cors: {
      allowCredentials: true,
      allowOrigins: [websiteUrl],
      allowHeaders: ["Authorization", "Content-Type"],
      allowMethods: ["*"],
      exposeHeaders: ["*"],
    },
  },
});
