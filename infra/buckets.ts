import { OriginAccessIdentity } from "sst/components/aws/providers/origin-access-identity";
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

export const publicBucketAccess = new OriginAccessIdentity(
  "PublicBucketAccess",
  {}
);
export const publicBucket = new sst.aws.Bucket("PublicBucket", {
  transform: {
    policy: (policyArgs) => {
      const newPolicy = aws.iam.getPolicyDocumentOutput({
        statements: [
          {
            principals: [
              {
                type: "AWS",
                identifiers: [
                  $interpolate`arn:${
                    aws.getPartitionOutput().partition
                  }:iam::cloudfront:user/CloudFront Origin Access Identity ${publicBucketAccess.id}`,
                ],
              },
            ],
            actions: ["s3:GetObject"],
            resources: [$interpolate`${publicBucket.arn}/*`],
          },
        ],
      }).json;

      policyArgs.policy = $output([policyArgs.policy, newPolicy]).apply(
        ([policy, newPolicy]) => {
          const policyJson = JSON.parse(policy as string);
          const newPolicyJson = JSON.parse(newPolicy as string);
          policyJson.Statement.push(...newPolicyJson.Statement);
          return JSON.stringify(policyJson);
        }
      );
    },
  },
});
