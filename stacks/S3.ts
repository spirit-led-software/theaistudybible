import { DatabaseScripts } from '@stacks';
import { RemovalPolicy } from 'aws-cdk-lib/core';
import { Bucket, dependsOn, type StackContext } from 'sst/constructs';

export function S3({ stack }: StackContext) {
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

  const userProfilePictureBucket = new Bucket(stack, 'userProfilePictureBucket', {
    cdk: {
      bucket: {
        autoDeleteObjects: stack.stage !== 'prod',
        removalPolicy: stack.stage === 'prod' ? RemovalPolicy.RETAIN : RemovalPolicy.DESTROY
      }
    }
  });

  const userGeneratedImageBucket = new Bucket(stack, 'userGeneratedImageBucket', {
    cdk: {
      bucket: {
        autoDeleteObjects: stack.stage !== 'prod',
        removalPolicy: stack.stage === 'prod' ? RemovalPolicy.RETAIN : RemovalPolicy.DESTROY
      }
    }
  });

  stack.addOutputs({
    IndexFileBucket: indexFileBucket.bucketName,
    DevotionImageBucket: devotionImageBucket.bucketName,
    UserProfilePictureBucket: userProfilePictureBucket.bucketName,
    UserGeneratedImageBucket: userGeneratedImageBucket.bucketName
  });

  return {
    indexFileBucket,
    devotionImageBucket,
    userProfilePictureBucket,
    userGeneratedImageBucket
  };
}
