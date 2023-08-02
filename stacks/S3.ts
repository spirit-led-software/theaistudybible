import { STATIC_ENV_VARS } from "@stacks";
import { RemovalPolicy } from "aws-cdk-lib/core";
import { Bucket, StackContext } from "sst/constructs";

export function S3({ stack }: StackContext) {
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

  stack.addOutputs({
    "S3 Bucket Name": indexFileBucket.bucketName,
  });

  return {
    indexFileBucket,
  };
}
