import { chatApi } from "./apis";
import { indexFileBucket, publicBucket } from "./buckets";
import { COMMON_ENV_VARS, LANGSMITH_ENV_VARS, domainName } from "./constants";
import { neonBranch, upstashRedis, upstashVector } from "./databases";
import { chromiumLayer } from "./layers";
import { webpageScraperQueue } from "./queues";

export let website = new sst.aws.SolidStart("Website", {
  path: "apps/website",
  link: [
    publicBucket,
    indexFileBucket,
    neonBranch,
    upstashRedis,
    upstashVector,
    webpageScraperQueue,
    chatApi,
  ],
  environment: {
    ...COMMON_ENV_VARS,
    ...LANGSMITH_ENV_VARS,
  },
  domain: domainName,
  transform: {
    server: (args) => {
      args.layers = [chromiumLayer.arn];
      args.nodejs = {
        esbuild: {
          external: ["@sparticuz/chromium"],
          minify: $app.stage === "prod",
          treeShaking: true,
        },
      };
    },
  },
});
