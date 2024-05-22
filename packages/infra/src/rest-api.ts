import { API, Buckets, DatabaseScripts } from '@revelationsai/infra';
import { dependsOn, use, type StackContext } from 'sst/constructs';

export function RestAPI({ stack }: StackContext) {
  dependsOn(DatabaseScripts);
  dependsOn(Buckets);

  const { api } = use(API);

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
    'POST /chats/search': 'packages/functions/src/rest/chats/search/post.handler',
    'GET /chats/{id}': 'packages/functions/src/rest/chats/[id]/get.handler',
    'PUT /chats/{id}': 'packages/functions/src/rest/chats/[id]/put.handler',
    'DELETE /chats/{id}': 'packages/functions/src/rest/chats/[id]/delete.handler',
    // Chat Messages
    'GET /chats/{id}/messages': 'packages/functions/src/rest/chats/[id]/messages/get.handler',

    // Chat sharing
    'GET /chats/{id}/share': 'packages/functions/src/rest/chats/[id]/share/get.handler',
    'POST /chats/{id}/share': 'packages/functions/src/rest/chats/[id]/share/post.handler',
    'DELETE /chats/{id}/share': 'packages/functions/src/rest/chats/[id]/share/delete.handler',

    // Data Sources
    'GET /data-sources': 'packages/functions/src/rest/data-sources/get.handler',
    'POST /data-sources/search': 'packages/functions/src/rest/data-sources/search/post.handler',
    'GET /data-sources/{id}': 'packages/functions/src/rest/data-sources/[id]/get.handler',

    // Devotions
    'GET /devotions': 'packages/functions/src/rest/devotions/get.handler',
    'POST /devotions/search': 'packages/functions/src/rest/devotions/search/post.handler',
    'GET /devotions/{id}': 'packages/functions/src/rest/devotions/[id]/get.handler',

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

    // LLMs
    'GET /language-models': 'packages/functions/src/rest/language-models/get.handler',

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
    'POST /users/search': 'packages/functions/src/rest/users/search/post.handler',
    'GET /users/{id}': 'packages/functions/src/rest/users/[id]/get.handler',
    'PUT /users/{id}': 'packages/functions/src/rest/users/[id]/put.handler',
    'DELETE /users/{id}': 'packages/functions/src/rest/users/[id]/delete.handler',

    // Change user password endpoint
    'POST /users/change-password': {
      function: {
        handler: 'packages/functions/src/rest/users/change-password/post.handler'
      }
    },

    // Generate presigned url for user profile picture upload
    'POST /users/profile-pictures/presigned-url':
      'packages/functions/src/rest/users/profile-pictures/presigned-url/post.handler',

    // User generated images
    'GET /generated-images': 'packages/functions/src/rest/generated-images/get.handler',
    'POST /generated-images': {
      function: {
        handler: 'packages/functions/src/rest/generated-images/post.handler',
        timeout: '10 minutes'
      }
    },
    'GET /generated-images/{id}': 'packages/functions/src/rest/generated-images/[id]/get.handler',
    'DELETE /generated-images/{id}':
      'packages/functions/src/rest/generated-images/[id]/delete.handler',

    // Generated Image Source Documents
    'GET /generated-images/{id}/source-documents':
      'packages/functions/src/rest/generated-images/[id]/source-documents/get.handler'
  });

  return {};
}
