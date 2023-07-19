import { Database, STATIC_ENV_VARS } from "@stacks";
import { RemovalPolicy } from "aws-cdk-lib/core";
import { Bucket, StackContext, use } from "sst/constructs";

export function S3({ stack }: StackContext) {
  const { database } = use(Database);

  const indexFileBucket = new Bucket(stack, "indexFileBucket", {
    defaults: {
      function: {
        bind: [database],
        environment: {
          DATABASE_RESOURCE_ARN: database.clusterArn,
          DATABASE_SECRET_ARN: database.secretArn,
          DATABASE_NAME: database.defaultDatabaseName,
          ...STATIC_ENV_VARS,
        },
        permissions: ["s3"],
        timeout: 60,
      },
    },
    notifications: {
      indexFile: {
        events: ["object_created"],
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
