import { apiRouter } from "./apis";
import { indexFileBucket, publicBucket } from "./buckets";
import {
  LANGSMITH_ENV_VARS,
  PUBLIC_ENV_VARS,
  SECRET_ENV_VARS,
  domainName,
} from "./constants";
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
    apiRouter,
  ],
  environment: {
    ...SECRET_ENV_VARS,
    ...LANGSMITH_ENV_VARS,
    ...Object.entries(PUBLIC_ENV_VARS).reduce(
      (acc, [key, value]) => {
        acc[`VITE_${key}`] = value;
        return acc;
      },
      {} as Record<string, string>
    ),
    VITE_API_URL: apiRouter.url,
  },
  domain: domainName,
  transform: {
    server: (args) => {
      args.layers = $output(args.layers).apply((layers) => [
        ...(layers ?? []),
        chromiumLayer.arn,
      ]);
      args.nodejs = $output(args.nodejs).apply((nodejs) => ({
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
