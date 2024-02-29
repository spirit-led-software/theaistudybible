import { API, Auth, DatabaseScripts } from '@stacks';
import { dependsOn, use, type StackContext } from 'sst/constructs';

export function GraphQlApi({ stack }: StackContext) {
  dependsOn(DatabaseScripts);

  const { auth } = use(Auth);
  const { api } = use(API);

  api.addRoutes(stack, {
    'POST /graphql': {
      function: {
        handler: 'packages/functions/src/graphql/index.handler',
        copyFiles: [
          {
            from: 'graphql/schema.graphql',
            to: 'graphql/schema.graphql'
          }
        ],
        nodejs: {
          install: ['@keyv/redis']
        },
        bind: [auth],
        memorySize: '2 GB'
      }
    }
  });

  return {};
}
