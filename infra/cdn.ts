import { publicBucket, publicBucketAccess } from "./buckets";
import { domainName } from "./constants";

export let cdn: sst.aws.Cdn | undefined = undefined;
// Create cloudfront distribution for non-dev environments
if ($app.stage === "prod") {
  cdn = new sst.aws.Cdn("CDN", {
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
          originAccessIdentity: publicBucketAccess.id,
        },
      },
    ],
  });
}
