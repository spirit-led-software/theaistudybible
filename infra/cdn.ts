import { publicBucket, publicBucketAccess } from "./buckets";
import { domainName } from "./constants";

export const cdn = new sst.aws.Cdn("CDN", {
  domain: `cdn.${domainName}`,
  defaultCacheBehavior: {
    allowedMethods: ["GET", "HEAD", "OPTIONS"],
    cachedMethods: ["GET", "HEAD", "OPTIONS"],
    minTtl: 0,
    defaultTtl: 3600,
    maxTtl: 3600,
    compress: true,
    targetOriginId: "S3Origin",
    viewerProtocolPolicy: "redirect-to-https",
    forwardedValues: {
      cookies: {
        forward: "none",
      },
      queryString: true,
    },
  },
  origins: [
    {
      originId: "S3Origin",
      domainName: publicBucket.nodes.bucket.bucketRegionalDomainName,
      s3OriginConfig: {
        originAccessIdentity: publicBucketAccess.cloudfrontAccessIdentityPath,
      },
    },
  ],
});
sst.Link.makeLinkable(sst.aws.Cdn, function (c) {
  return {
    properties: {
      url: c.url,
    },
  };
});
