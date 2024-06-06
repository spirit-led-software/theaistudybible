/// <reference path="./.sst/platform/config.d.ts" />

export default $config({
  app(input) {
    return {
      name: "theaistudybible",
      removal: input?.stage === "production" ? "retain" : "remove",
      home: "aws",
      providers: {
        aws: {
          region: "us-east-1",
        },
      },
    };
  },
  async run() {
    await import("./infra/constants");
    const layers = await import("./infra/layers");
    const buckets = await import("./infra/buckets");
    const cdn = await import("./infra/cdn");
    const databases = await import("./infra/databases");
    await import("./infra/crons");
    const queues = await import("./infra/queues");
    const website = await import("./infra/website");

    return {
      CdnUrl: cdn.cdn.url,
      ChromiumLayer: $interpolate`${layers.chromiumLayer.layerName}:${layers.chromiumLayer.version}`,
      IndexFileBucketName: buckets.indexFileBucket.name,
      PublicBucketName: buckets.publicBucket.name,
      UpstashRedisRestUrl: $interpolate`https://${databases.upstashRedis.endpoint}`,
      UpstashVectorRestUrl: databases.upstashVector.restUrl,
      WebpageScraperQueueUrl: queues.webpageScraperQueue.url,
      WebsiteUrl: website.website.url,
    };
  },
});
