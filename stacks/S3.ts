import { DatabaseScripts } from '@stacks';
import { OriginAccessIdentity } from 'aws-cdk-lib/aws-cloudfront';
import { RemovalPolicy } from 'aws-cdk-lib/core';
import { Bucket, dependsOn, type StackContext } from 'sst/constructs';

export function S3({ app, stack }: StackContext) {
  dependsOn(DatabaseScripts);

  const indexFileBucket = new Bucket(stack, 'indexFileBucket', {
    defaults: {
      function: {
        permissions: ['s3'],
        timeout: '15 minutes',
        memorySize: '2 GB'
      }
    },
    notifications: {
      indexFile: {
        events: ['object_created'],
        function: {
          handler: 'packages/functions/src/scraper/file/file.handler',
          retryAttempts: 0
        }
      }
    },
    cdk: {
      bucket: {
        autoDeleteObjects: stack.stage !== 'prod',
        removalPolicy: stack.stage === 'prod' ? RemovalPolicy.RETAIN : RemovalPolicy.DESTROY
      }
    }
  });

  const devotionImageBucket = new Bucket(stack, 'devotionImageBucket', {
    cdk: {
      bucket: {
        autoDeleteObjects: stack.stage !== 'prod',
        removalPolicy: stack.stage === 'prod' ? RemovalPolicy.RETAIN : RemovalPolicy.DESTROY
      }
    }
  });
  const devotionImageBucketOriginAccessIdentity = new OriginAccessIdentity(
    stack,
    'DevotionImageBucketOriginAccessIdentity'
  );
  devotionImageBucket.cdk.bucket.grantRead(devotionImageBucketOriginAccessIdentity);

  const userProfilePictureBucket = new Bucket(stack, 'userProfilePictureBucket', {
    cdk: {
      bucket: {
        autoDeleteObjects: stack.stage !== 'prod',
        removalPolicy: stack.stage === 'prod' ? RemovalPolicy.RETAIN : RemovalPolicy.DESTROY
      }
    }
  });
  const userProfilePictureBucketOriginAccessIdentity = new OriginAccessIdentity(
    stack,
    'UserProfilePictureBucketOriginAccessIdentity'
  );
  userProfilePictureBucket.cdk.bucket.grantRead(userProfilePictureBucketOriginAccessIdentity);

  const userGeneratedImageBucket = new Bucket(stack, 'userGeneratedImageBucket', {
    cdk: {
      bucket: {
        autoDeleteObjects: stack.stage !== 'prod',
        removalPolicy: stack.stage === 'prod' ? RemovalPolicy.RETAIN : RemovalPolicy.DESTROY
      }
    }
  });
  const userGeneratedImageBucketOriginAccessIdentity = new OriginAccessIdentity(
    stack,
    'UserGeneratedImageBucketOriginAccessIdentity'
  );
  userGeneratedImageBucket.cdk.bucket.grantRead(userGeneratedImageBucketOriginAccessIdentity);

  app.addDefaultFunctionBinding([
    indexFileBucket,
    devotionImageBucket,
    userProfilePictureBucket,
    userGeneratedImageBucket
  ]);
  app.addDefaultFunctionPermissions([
    indexFileBucket,
    devotionImageBucket,
    userProfilePictureBucket,
    userGeneratedImageBucket
  ]);

  stack.addOutputs({
    IndexFileBucket: indexFileBucket.bucketName,
    DevotionImageBucket: devotionImageBucket.bucketName,
    UserProfilePictureBucket: userProfilePictureBucket.bucketName,
    UserGeneratedImageBucket: userGeneratedImageBucket.bucketName
  });

  return {
    indexFileBucket,
    devotionImageBucket,
    devotionImageBucketOriginAccessIdentity,
    userProfilePictureBucket,
    userProfilePictureBucketOriginAccessIdentity,
    userGeneratedImageBucket,
    userGeneratedImageBucketOriginAccessIdentity
  };
}
