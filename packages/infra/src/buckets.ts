import { DatabaseScripts } from '@revelationsai/infra';
import { OriginAccessIdentity } from 'aws-cdk-lib/aws-cloudfront';
import { RemovalPolicy } from 'aws-cdk-lib/core';
import { Bucket, dependsOn, type StackContext } from 'sst/constructs';

export function Buckets({ app, stack }: StackContext) {
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
          handler: 'apps/functions/src/scraper/file/file.handler',
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

  const publicBucket = new Bucket(stack, 'PublicBucket', {
    cdk: {
      bucket: {
        autoDeleteObjects: stack.stage !== 'prod',
        removalPolicy: stack.stage === 'prod' ? RemovalPolicy.RETAIN : RemovalPolicy.DESTROY
      }
    }
  });
  const publicBucketOriginAccessIdentity = new OriginAccessIdentity(
    stack,
    'PublicBucketOriginAccessIdentity'
  );
  publicBucket.cdk.bucket.grantRead(publicBucketOriginAccessIdentity);

  app.addDefaultFunctionBinding([indexFileBucket, publicBucket]);
  app.addDefaultFunctionPermissions([indexFileBucket, publicBucket]);

  stack.addOutputs({
    IndexFileBucket: indexFileBucket.bucketName,
    PublicBucket: publicBucket.bucketName
  });

  return {
    indexFileBucket,
    publicBucket,
    publicBucketOriginAccessIdentity
  };
}
