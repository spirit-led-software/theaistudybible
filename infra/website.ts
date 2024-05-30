import { indexFileBucket, publicBucket } from "./buckets";
import { domainName } from "./constants";
import { neonBranch, upstashRedis, upstashVector } from "./databases";
import { webpageScraperQueue } from "./queues";

export let website: sst.aws.SvelteKit | undefined = undefined;
if (!$dev) {
  website = new sst.aws.SvelteKit("Website", {
    path: "apps/website",
    link: [
      publicBucket,
      indexFileBucket,
      neonBranch,
      upstashRedis,
      upstashVector,
      webpageScraperQueue,
    ],
    domain: domainName,
    transform: {
      server: (args) => {
        args.nodejs = {
          ...args.nodejs,
          esbuild: {
            external: ["@sparticuz/chromium"],
            minify: $app.stage === "prod",
            splitting: $app.stage === "prod",
            treeShaking: true,
            target: "esnext",
            format: "esm",
          },
        };
        return args;
      },
    },
  });
}
