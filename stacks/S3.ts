import { Constants, DatabaseScripts, STATIC_ENV_VARS } from "@stacks";
import { RemovalPolicy } from "aws-cdk-lib/core";
import { Bucket, StackContext, dependsOn, use } from "sst/constructs";

export function S3({ stack }: StackContext) {
  dependsOn(DatabaseScripts);

  const { invokeBedrockPolicy } = use(Constants);
  const {
    dbReadWriteUrl,
    dbReadOnlyUrl,
    vectorDbReadWriteUrl,
    vectorDbReadOnlyUrl,
  } = use(DatabaseScripts);

  const indexFileBucket = new Bucket(stack, "indexFileBucket", {
    defaults: {
      function: {
        environment: {
          DATABASE_READWRITE_URL: dbReadWriteUrl,
          DATABASE_READONLY_URL: dbReadOnlyUrl,
          VECTOR_DB_READWRITE_URL: vectorDbReadWriteUrl,
          VECTOR_DB_READONLY_URL: vectorDbReadOnlyUrl,
          ...STATIC_ENV_VARS,
        },
        permissions: ["s3", invokeBedrockPolicy],
        timeout: "2 minutes",
        memorySize: "2 GB",
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

  const devotionImageBucket = new Bucket(stack, "devotionImageBucket", {
    cdk: {
      bucket: {
        autoDeleteObjects: stack.stage !== "prod",
        removalPolicy:
          stack.stage === "prod" ? RemovalPolicy.RETAIN : RemovalPolicy.DESTROY,
      },
    },
  });

  const userProfilePictureBucket = new Bucket(
    stack,
    "userProfilePictureBucket",
    {
      cdk: {
        bucket: {
          autoDeleteObjects: stack.stage !== "prod",
          removalPolicy:
            stack.stage === "prod"
              ? RemovalPolicy.RETAIN
              : RemovalPolicy.DESTROY,
        },
      },
    }
  );

  const userGeneratedImageBucket = new Bucket(
    stack,
    "userGeneratedImageBucket",
    {
      cdk: {
        bucket: {
          autoDeleteObjects: stack.stage !== "prod",
          removalPolicy:
            stack.stage === "prod"
              ? RemovalPolicy.RETAIN
              : RemovalPolicy.DESTROY,
        },
      },
    }
  );

  stack.addOutputs({
    IndexFileBucket: indexFileBucket.bucketName,
    DevotionImageBucket: devotionImageBucket.bucketName,
    UserProfilePictureBucket: userProfilePictureBucket.bucketName,
    UserGeneratedImageBucket: userGeneratedImageBucket.bucketName,
  });

  return {
    indexFileBucket,
    devotionImageBucket,
    userProfilePictureBucket,
    userGeneratedImageBucket,
  };
}
