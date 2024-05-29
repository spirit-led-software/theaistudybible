/// <reference path="./.sst/platform/config.d.ts" />

import * as upstash from "@upstash/pulumi";
import { NeonBranch } from "./infra/resources/neon-branch";
import { UpstashVector } from "./infra/resources/upstash-vector";

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
    const constants = await import("./infra/constants");
    await import("./infra/layers");
    const buckets = await import("./infra/buckets");
    const cdns = await import("./infra/cdns");
    const databases = await import("./infra/databases");
    await import("./infra/crons");

    return {
      PublicBucketName: buckets.publicBucket.name,
      CdnUrl: cdns.cdnUrl,
      UpstashRedisUrl: databases.upstashRedisUrl,
      UpstashRedisRestUrl: databases.upstashRedisRestUrl,
      UpstashVectorRestUrl: databases.upstashVector.restUrl,
      WebsiteUrl: constants.websiteUrl,
    };
  },
});
