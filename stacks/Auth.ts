import { API, Constants, DatabaseScripts, STATIC_ENV_VARS } from '@stacks';
import { Auth as AuthConstruct, StackContext, SvelteKitSite, dependsOn, use } from 'sst/constructs';

export function Auth({ stack, app }: StackContext) {
  dependsOn(DatabaseScripts);

  const { api, apiUrl } = use(API);
  const { domainName, websiteUrl, hostedZone } = use(Constants);
  const { dbReadOnlyUrl, dbReadWriteUrl } = use(DatabaseScripts);

  const authUiDomain = `auth.${domainName}`;
  const authUiUrl = app.mode === 'dev' ? `http://localhost:8910` : `https://${authUiDomain}`;

  const auth = new AuthConstruct(stack, 'auth', {
    authenticator: {
      handler: 'packages/functions/src/auth/auth.handler',
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

  return {
    auth,
    authUi,
    authUiUrl,
    authUiDomain
  };
}
