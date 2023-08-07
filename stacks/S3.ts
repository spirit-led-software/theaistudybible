import { DatabaseScripts, STATIC_ENV_VARS } from "@stacks";
import { RemovalPolicy } from "aws-cdk-lib/core";
import { Bucket, StackContext, dependsOn } from "sst/constructs";

export function S3({ stack }: StackContext) {
  dependsOn(DatabaseScripts);

  const indexFileBucket = new Bucket(stack, "indexFileBucket", {
    defaults: {
      function: {
        environment: {
          ...STATIC_ENV_VARS,
        },
        permissions: ["s3"],
        timeout: "60 seconds",
      },
    },
    notifications: {
      indexFile: {
        function: {
          handler: "packages/functions/src/scraper/file.handler",
        },
      },
    },
    cdk: {
      bucket: {
        autoDeleteObjects: stack.stage !== "prod",
        removalPolicy:
          stack.stage === "prod" ? RemovalPolicy.RETAIN : RemovalPolicy.DESTROY,
      },
    },
  });

  const devotionImageBucket = new Bucket(stack, "devotionImageBucket", {
    cdk: {
      bucket: {
        autoDeleteObjects: stack.stage !== "prod",
        removalPolicy:
          stack.stage === "prod" ? RemovalPolicy.RETAIN : RemovalPolicy.DESTROY,
      },
    },
  });

  stack.addOutputs({
    IndexFileBucket: indexFileBucket.bucketName,
    DevotionImageBucket: devotionImageBucket.bucketName,
  });

  return {
    indexFileBucket,
    devotionImageBucket,
  };
}
