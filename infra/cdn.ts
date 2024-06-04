import { publicBucket, publicBucketAccess } from "./buckets";
import { domainName } from "./constants";

export const cdn = new sst.aws.Cdn("CDN", {
  domain: `cdn.${domainName}`,
  defaultCacheBehavior: {
    allowedMethods: ["GET", "HEAD", "OPTIONS"],
    cachedMethods: ["GET", "HEAD", "OPTIONS"],
    defaultTtl: 3600,
    compress: true,
    targetOriginId: "S3Origin",
    viewerProtocolPolicy: "redirect-to-https",
  },
  origins: [
    {
      originId: "S3Origin",
      domainName: publicBucket.nodes.bucket.bucketRegionalDomainName,
      s3OriginConfig: {
        originAccessIdentity: $interpolate`origin-access-identity/cloudfront/${publicBucketAccess.id}`,
      },
    },
  ],
});
