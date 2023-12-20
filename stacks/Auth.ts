import { API, COMMON_ENV_VARS, Constants, DatabaseScripts, Layers } from '@stacks';
import { Architecture } from 'aws-cdk-lib/aws-lambda';
import {
  Auth as AuthConstruct,
  SvelteKitSite,
  dependsOn,
  use,
  type StackContext
} from 'sst/constructs';

export function Auth({ stack }: StackContext) {
  dependsOn(DatabaseScripts);

  const { argonLayer, axiomLayer } = use(Layers);
  const { api } = use(API);
  const { domainName, apiUrl, websiteUrl, hostedZone, authUiUrl } = use(Constants);

  const auth = new AuthConstruct(stack, 'auth', {
    authenticator: {
      handler: 'packages/functions/src/auth/auth.handler',
      layers: [argonLayer],
      copyFiles: [
        {
          from: 'emails',
          to: 'emails'
        },
        {
          from: 'apple-auth-key.p8',
          to: 'apple-auth-key.p8'
        }
      ],
      timeout: '30 seconds',
      memorySize: '512 MB'
    }
  });

  api.addRoutes(stack, {
    // Legacy endpoints
    // TODO: remove these
    'GET /session': {
      function: {
        handler: 'packages/functions/src/auth/session.handler',
        memorySize: '1536 MB'
      }
    },
    'GET /refresh-session': {
      function: {
        handler: 'packages/functions/src/auth/refresh-session.handler',
        bind: [auth],
        memorySize: '1536 MB'
      }
    },

    // New endpoints that will replace the above
    'GET /auth/user-info': {
      function: {
        handler: 'packages/functions/src/auth/session.handler',
        memorySize: '1536 MB'
      }
    },
    'GET /auth/refresh-token': {
      function: {
        handler: 'packages/functions/src/auth/refresh-session.handler',
        bind: [auth],
        memorySize: '1536 MB'
      }
    }
  });

  auth.attach(stack, {
    api
  });

  const authUi = new SvelteKitSite(stack, 'auth-ui', {
    path: 'packages/auth-ui',
    bind: [api],
    permissions: [api],
    environment: {
      ...COMMON_ENV_VARS,
      PUBLIC_WEBSITE_URL: websiteUrl,
      PUBLIC_API_URL: apiUrl,
      PUBLIC_AUTH_URL: authUiUrl
    },
    customDomain: {
      domainName: `auth.${domainName}`,
      hostedZone: hostedZone.zoneName
    },
    dev: {
      url: authUiUrl
    },
    cdk: {
      server: {
        layers: [axiomLayer],
        architecture: Architecture.X86_64
      }
    }
  });

  stack.addOutputs({
    AuthUrl: authUiUrl
  });

  return {
    auth,
    authUi
  };
}
