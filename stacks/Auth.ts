import { API, Constants, DatabaseScripts, Layers, STATIC_ENV_VARS } from '@stacks';
import {
  Auth as AuthConstruct,
  SvelteKitSite,
  dependsOn,
  use,
  type StackContext
} from 'sst/constructs';

export function Auth({ stack }: StackContext) {
  dependsOn(DatabaseScripts);

  const { argonLayer } = use(Layers);
  const { api, apiUrl } = use(API);
  const { domainName, websiteUrl, hostedZone, authUiUrl } = use(Constants);
  const { dbReadOnlyUrl, dbReadWriteUrl } = use(DatabaseScripts);

  const auth = new AuthConstruct(stack, 'auth', {
    authenticator: {
      handler: 'packages/functions/src/auth/auth.handler',
      layers: [argonLayer],
      nodejs: {
        esbuild: {
          external: ['argon2']
        }
      },
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
      environment: {
        ...STATIC_ENV_VARS,
        WEBSITE_URL: websiteUrl,
        AUTH_URL: authUiUrl,
        DATABASE_READWRITE_URL: dbReadWriteUrl,
        DATABASE_READONLY_URL: dbReadOnlyUrl
      },
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
        memorySize: '512 MB'
      }
    },
    'GET /refresh-session': {
      function: {
        handler: 'packages/functions/src/auth/refresh-session.handler',
        bind: [auth],
        memorySize: '512 MB'
      }
    },

    // New endpoints that will replace the above
    'GET /auth/user-info': {
      function: {
        handler: 'packages/functions/src/auth/session.handler',
        memorySize: '512 MB'
      }
    },
    'GET /auth/refresh-token': {
      function: {
        handler: 'packages/functions/src/auth/refresh-session.handler',
        bind: [auth],
        memorySize: '512 MB'
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
      ...STATIC_ENV_VARS,
      PUBLIC_WEBSITE_URL: websiteUrl,
      PUBLIC_API_URL: apiUrl,
      PUBLIC_AUTH_URL: authUiUrl,
      DATABASE_READWRITE_URL: dbReadWriteUrl,
      DATABASE_READONLY_URL: dbReadOnlyUrl
    },
    customDomain: {
      domainName: `auth.${domainName}`,
      hostedZone: hostedZone.zoneName
    },
    dev: {
      url: authUiUrl
    },
    memorySize: '1 GB'
  });

  stack.addOutputs({
    AuthUrl: authUi.url
  });

  return {
    auth,
    authUi
  };
}
