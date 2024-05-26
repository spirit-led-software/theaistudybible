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
    const constants = await import("@theaistudybible/infra/constants");
    const buckets = await import("@theaistudybible/infra/buckets");
    const cdn = await import("@theaistudybible/infra/cdn");
    const database = await import("@theaistudybible/infra/database");

    return {
      PublicBucketName: buckets.publicBucket.name,
      CdnUrl: cdn.cdnUrl,
      UpstashRedisUrl: database.upstashRedis.endpoint,
      UpstashRedisRestUrl: database.upstashRedis.endpoint,
      UpstashVectorRestUrl: database.upstashVector.restUrl,
      WebsiteUrl: constants.websiteUrl,
    };
  },
});
