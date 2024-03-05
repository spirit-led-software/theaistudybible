import { CDN, DatabaseScripts } from '@stacks';
import { S3Origin } from 'aws-cdk-lib/aws-cloudfront-origins';
import { RemovalPolicy } from 'aws-cdk-lib/core';
import { Bucket, dependsOn, use, type StackContext } from 'sst/constructs';

export function S3({ stack }: StackContext) {
  dependsOn(DatabaseScripts);

  const { cdn } = use(CDN);

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
  if (cdn) {
    cdn.addBehavior('/devotion-images', new S3Origin(devotionImageBucket.cdk.bucket));
  }

  const userProfilePictureBucket = new Bucket(stack, 'userProfilePictureBucket', {
    cdk: {
      bucket: {
        autoDeleteObjects: stack.stage !== 'prod',
        removalPolicy: stack.stage === 'prod' ? RemovalPolicy.RETAIN : RemovalPolicy.DESTROY
      }
    }
  });
  if (cdn) {
    cdn.addBehavior('/user-profile-pictures', new S3Origin(userProfilePictureBucket.cdk.bucket));
  }

  const userGeneratedImageBucket = new Bucket(stack, 'userGeneratedImageBucket', {
    cdk: {
      bucket: {
        autoDeleteObjects: stack.stage !== 'prod',
        removalPolicy: stack.stage === 'prod' ? RemovalPolicy.RETAIN : RemovalPolicy.DESTROY
      }
    }
  });
  if (cdn) {
    cdn.addBehavior('/user-generated-images', new S3Origin(userGeneratedImageBucket.cdk.bucket));
  }

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
