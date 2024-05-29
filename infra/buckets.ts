import { neonBranch, upstashRedis, upstashVector } from "./databases";

export const indexFileBucket = new sst.aws.Bucket("IndexFileBucket");
indexFileBucket.subscribe(
  {
    handler: "apps/functions/src/scraper/file.handler",
    link: [neonBranch, upstashVector, upstashRedis],
  },
  {
    events: ["s3:ObjectCreated:*"],
  }
);

export const publicBucket = new sst.aws.Bucket("PublicBucket", {
  transform: {
    bucket: {
      forceDestroy: $app.stage !== "prod",
    },
  },
});
