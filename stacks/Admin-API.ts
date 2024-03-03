import { API, Constants, DatabaseScripts, Layers, Queues, S3 } from '@stacks';
import type { CfnFunction } from 'aws-cdk-lib/aws-lambda';
import { Function, dependsOn, use, type StackContext } from 'sst/constructs';

export function AdminAPI({ stack }: StackContext) {
  dependsOn(DatabaseScripts);

  const { invokeBedrockPolicy } = use(Constants);
  const { userProfilePictureBucket, indexFileBucket, devotionImageBucket } = use(S3);
  const { argonLayer, chromiumLayer, axiomX86Layer } = use(Layers);
  const { webpageIndexQueue } = use(Queues);
  const { api } = use(API);

  const dataSourceSyncFunction = new Function(stack, 'DataSourceSyncFunction', {
    handler: 'packages/functions/src/rest/admin/data-sources/[id]/sync/post.handler',
    architecture: 'x86_64',
    runtime: 'nodejs18.x',
    permissions: [invokeBedrockPolicy, indexFileBucket, webpageIndexQueue],
    bind: [indexFileBucket, webpageIndexQueue],
    environment: {
      INDEX_FILE_BUCKET: indexFileBucket.bucketName
    },
    memorySize: '2 GB',
    timeout: '15 minutes'
  });
  // add layers
  (dataSourceSyncFunction.node.defaultChild as CfnFunction).addPropertyOverride('Layers', [
    chromiumLayer.layerVersionArn,
    axiomX86Layer.layerVersionArn
  ]);

  api.addRoutes(stack, {
    // Data Sources
    'POST /admin/data-sources': 'packages/functions/src/rest/admin/data-sources/post.handler',
    'PUT /admin/data-sources/{id}': {
      function: {
        handler: 'packages/functions/src/rest/admin/data-sources/[id]/put.handler',
        timeout: '15 minutes'
      }
    },
    'DELETE /admin/data-sources/{id}': {
      function: {
        handler: 'packages/functions/src/rest/admin/data-sources/[id]/delete.handler',
        timeout: '15 minutes'
      }
    },
    'POST /admin/data-sources/{id}/sync': dataSourceSyncFunction,

    // Devotions
    'POST /admin/devotions': {
      function: {
        handler: 'packages/functions/src/rest/admin/devotions/post.handler',
        bind: [devotionImageBucket],
        permissions: [devotionImageBucket, invokeBedrockPolicy],
        environment: {
          DEVOTION_IMAGE_BUCKET: devotionImageBucket.bucketName
        },
        timeout: '5 minutes'
      }
    },
    'PUT /admin/devotions/{id}': 'packages/functions/src/rest/admin/devotions/[id]/put.handler',
    'DELETE /admin/devotions/{id}':
      'packages/functions/src/rest/admin/devotions/[id]/delete.handler',

    // Index Operations
    'GET /admin/index-operations': 'packages/functions/src/rest/admin/index-operations/get.handler',
    'POST /admin/index-operations/search':
      'packages/functions/src/rest/admin/index-operations/search/post.handler',
    'GET /admin/index-operations/{id}':
      'packages/functions/src/rest/admin/index-operations/[id]/get.handler',
    'PUT /admin/index-operations/{id}':
      'packages/functions/src/rest/admin/index-operations/[id]/put.handler',
    'DELETE /admin/index-operations/{id}':
      'packages/functions/src/rest/admin/index-operations/[id]/delete.handler',

    // Reactions
    'GET /admin/reactions/ai-response':
      'packages/functions/src/rest/admin/reactions/ai-response/get.handler',
    'GET /admin/reactions/devotion':
      'packages/functions/src/rest/admin/reactions/devotion/get.handler',

    // Users
    'POST /admin/users': {
      function: {
        handler: 'packages/functions/src/rest/admin/users/post.handler',
        layers: [argonLayer]
      }
    },
    'PUT /admin/users/{id}': 'packages/functions/src/rest/admin/users/[id]/put.handler',
    'DELETE /admin/users/{id}': 'packages/functions/src/rest/admin/users/[id]/delete.handler',

    // User roles
    'GET /admin/users/{id}/roles': 'packages/functions/src/rest/admin/users/[id]/roles/get.handler',

    // Change user password endpoint
    'PUT /admin/users/{id}/password': {
      function: {
        handler: 'packages/functions/src/rest/admin/users/[id]/password/put.handler',
        layers: [argonLayer]
      }
    },

    // Generate presigned url for user profile picture upload
    'POST /admin/users/{id}/profile-picture/presigned-url': {
      function: {
        handler:
          'packages/functions/src/rest/admin/users/[id]/profile-picture/presigned-url/post.handler',
        bind: [userProfilePictureBucket],
        permissions: [userProfilePictureBucket],
        environment: {
          USER_PROFILE_PICTURE_BUCKET: userProfilePictureBucket.bucketName
        }
      }
    }
  });

  return {};
}
