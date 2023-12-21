import { API, Constants, DatabaseScripts, Layers, Queues, S3 } from '@stacks';
import type { CfnFunction } from 'aws-cdk-lib/aws-lambda';
import { Function, dependsOn, use, type StackContext } from 'sst/constructs';

export function RestAPI({ stack }: StackContext) {
  dependsOn(DatabaseScripts);

  const { invokeBedrockPolicy } = use(Constants);
  const {
    indexFileBucket,
    devotionImageBucket,
    userProfilePictureBucket,
    userGeneratedImageBucket
  } = use(S3);
  const { argonLayer, chromiumLayer, axiomX86Layer } = use(Layers);
  const { webpageIndexQueue } = use(Queues);
  const { api } = use(API);

  const dataSourceSyncFunction = new Function(stack, 'dataSourceSyncFunction', {
    handler: 'packages/functions/src/rest/data-sources/[id]/sync/post.handler',
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
    // AI Responses
    'GET /ai-responses': 'packages/functions/src/rest/ai-responses/get.handler',
    'POST /ai-responses': 'packages/functions/src/rest/ai-responses/post.handler',
    'POST /ai-responses/search': 'packages/functions/src/rest/ai-responses/search/post.handler',
    'GET /ai-responses/{id}': 'packages/functions/src/rest/ai-responses/[id]/get.handler',
    'PUT /ai-responses/{id}': 'packages/functions/src/rest/ai-responses/[id]/put.handler',
    'DELETE /ai-responses/{id}': 'packages/functions/src/rest/ai-responses/[id]/delete.handler',

    // AI Response Source Documents
    'GET /ai-responses/{id}/source-documents':
      'packages/functions/src/rest/ai-responses/[id]/source-documents/get.handler',

    // AI Response Reactions
    'GET /ai-responses/{id}/reactions':
      'packages/functions/src/rest/ai-responses/[id]/reactions/get.handler',
    'POST /ai-responses/{id}/reactions':
      'packages/functions/src/rest/ai-responses/[id]/reactions/post.handler',

    // Chats
    'GET /chats': 'packages/functions/src/rest/chats/get.handler',
    'POST /chats': 'packages/functions/src/rest/chats/post.handler',
    'GET /chats/{id}': 'packages/functions/src/rest/chats/[id]/get.handler',
    'PUT /chats/{id}': 'packages/functions/src/rest/chats/[id]/put.handler',
    'DELETE /chats/{id}': 'packages/functions/src/rest/chats/[id]/delete.handler',

    // Data Sources
    'GET /data-sources': 'packages/functions/src/rest/data-sources/get.handler',
    'POST /data-sources': 'packages/functions/src/rest/data-sources/post.handler',
    'POST /data-sources/search': 'packages/functions/src/rest/data-sources/search/post.handler',
    'GET /data-sources/{id}': 'packages/functions/src/rest/data-sources/[id]/get.handler',
    'PUT /data-sources/{id}': {
      function: {
        handler: 'packages/functions/src/rest/data-sources/[id]/put.handler',
        timeout: '15 minutes'
      }
    },
    'DELETE /data-sources/{id}': {
      function: {
        handler: 'packages/functions/src/rest/data-sources/[id]/delete.handler',
        timeout: '15 minutes'
      }
    },
    'POST /data-sources/{id}/sync': dataSourceSyncFunction,

    // Devotions
    'GET /devotions': 'packages/functions/src/rest/devotions/get.handler',
    'POST /devotions': {
      function: {
        handler: 'packages/functions/src/rest/devotions/post.handler',
        bind: [devotionImageBucket],
        permissions: [devotionImageBucket, invokeBedrockPolicy],
        environment: {
          DEVOTION_IMAGE_BUCKET: devotionImageBucket.bucketName
        },
        timeout: '5 minutes'
      }
    },
    'GET /devotions/{id}': 'packages/functions/src/rest/devotions/[id]/get.handler',
    'PUT /devotions/{id}': 'packages/functions/src/rest/devotions/[id]/put.handler',
    'DELETE /devotions/{id}': 'packages/functions/src/rest/devotions/[id]/delete.handler',

    // Devotion Source Documents
    'GET /devotions/{id}/source-documents':
      'packages/functions/src/rest/devotions/[id]/source-documents/get.handler',

    // Devotion Reactions
    'GET /devotions/{id}/reactions':
      'packages/functions/src/rest/devotions/[id]/reactions/get.handler',
    'POST /devotions/{id}/reactions':
      'packages/functions/src/rest/devotions/[id]/reactions/post.handler',
    'GET /devotions/{id}/reactions/counts':
      'packages/functions/src/rest/devotions/[id]/reactions/counts/get.handler',

    // Devotion Images
    'GET /devotions/{id}/images': 'packages/functions/src/rest/devotions/[id]/images/get.handler',

    // Index Operations
    'GET /index-operations': 'packages/functions/src/rest/index-operations/get.handler',
    'POST /index-operations/search':
      'packages/functions/src/rest/index-operations/search/post.handler',
    'GET /index-operations/{id}': 'packages/functions/src/rest/index-operations/[id]/get.handler',
    'PUT /index-operations/{id}': 'packages/functions/src/rest/index-operations/[id]/put.handler',
    'DELETE /index-operations/{id}':
      'packages/functions/src/rest/index-operations/[id]/delete.handler',

    // Reactions
    'GET /reactions/ai-response': 'packages/functions/src/rest/reactions/ai-response/get.handler',
    'GET /reactions/devotion': 'packages/functions/src/rest/reactions/devotion/get.handler',

    // User Messages
    'GET /user-messages': 'packages/functions/src/rest/user-messages/get.handler',
    'POST /user-messages': 'packages/functions/src/rest/user-messages/post.handler',
    'POST /user-messages/search': 'packages/functions/src/rest/user-messages/search/post.handler',
    'GET /user-messages/{id}': 'packages/functions/src/rest/user-messages/[id]/get.handler',
    'PUT /user-messages/{id}': 'packages/functions/src/rest/user-messages/[id]/put.handler',
    'DELETE /user-messages/{id}': 'packages/functions/src/rest/user-messages/[id]/delete.handler',
    'GET /user-messages/most-asked':
      'packages/functions/src/rest/user-messages/most-asked/get.handler',

    // Users
    'GET /users': 'packages/functions/src/rest/users/get.handler',
    'GET /users/{id}': 'packages/functions/src/rest/users/[id]/get.handler',
    'PUT /users/{id}': 'packages/functions/src/rest/users/[id]/put.handler',
    'DELETE /users/{id}': 'packages/functions/src/rest/users/[id]/delete.handler',

    // User query counts
    'GET /users/{id}/query-counts':
      'packages/functions/src/rest/users/[id]/query-counts/get.handler',

    // Change user password endpoint
    'POST /users/change-password': {
      function: {
        handler: 'packages/functions/src/rest/users/change-password/post.handler',
        layers: [argonLayer]
      }
    },

    // Generate presigned url for user profile picture upload
    'POST /users/profile-pictures/presigned-url': {
      function: {
        handler: 'packages/functions/src/rest/users/profile-pictures/presigned-url/post.handler',
        bind: [userProfilePictureBucket],
        permissions: [userProfilePictureBucket],
        environment: {
          USER_PROFILE_PICTURE_BUCKET: userProfilePictureBucket.bucketName
        }
      }
    },

    // User generated images
    'GET /generated-images': 'packages/functions/src/rest/generated-images/get.handler',
    'POST /generated-images': {
      function: {
        handler: 'packages/functions/src/rest/generated-images/post.handler',
        bind: [userGeneratedImageBucket],
        permissions: [userGeneratedImageBucket, invokeBedrockPolicy],
        timeout: '10 minutes',
        environment: {
          USER_GENERATED_IMAGE_BUCKET: userGeneratedImageBucket.bucketName
        }
      }
    },
    'GET /generated-images/{id}': 'packages/functions/src/rest/generated-images/[id]/get.handler',
    'DELETE /generated-images/{id}':
      'packages/functions/src/rest/generated-images/[id]/delete.handler'
  });

  return {};
}
