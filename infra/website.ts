import { chatApi } from "./apis";
import { indexFileBucket, publicBucket } from "./buckets";
import { COMMON_ENV_VARS, LANGSMITH_ENV_VARS, domainName } from "./constants";
import { neonBranch, upstashRedis, upstashVector } from "./databases";
import { webpageScraperQueue } from "./queues";

export let website = new sst.aws.SvelteKit("Website", {
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
    ORIGIN: domainName,
    PROTOCOL_HEADER: "x-forwarded-proto",
    HOST_HEADER: "x-forwarded-host",
  },
  domain: domainName,
  transform: {
    server: (args) => {
      args.nodejs = $resolve([args.nodejs]).apply(([nodejs]) => ({
        ...nodejs,
        esbuild: {
          ...nodejs?.esbuild,
          external: ["@sparticuz/chromium"],
          minify: $app.stage === "prod",
          treeShaking: true,
        },
      }));
    },
  },
});
