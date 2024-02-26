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
        bind: [auth]
      }
    }
  });

  return {};
}
