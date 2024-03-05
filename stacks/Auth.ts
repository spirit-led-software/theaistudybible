import { API, COMMON_ENV_VARS, Constants, Database, DatabaseScripts, Layers } from '@stacks';
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

  const { domainName, apiUrl, websiteUrl, hostedZone, authUiUrl } = use(Constants);
  const { argonLayer, axiomArm64Layer } = use(Layers);
  const { neonBranchConfigs, upstashRedisConfigs } = use(Database);
  const { api } = use(API);

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
  auth.attach(stack, {
    api
  });

  api.addRoutes(stack, {
    'GET /auth/user-info': {
      function: {
        handler: 'packages/functions/src/auth/user-info.handler',
        memorySize: '1536 MB'
      }
    }
  });

  const authUi = new SvelteKitSite(stack, 'auth-ui', {
    path: 'packages/auth-ui',
    permissions: [api],
    bind: [auth, api, ...Object.values(neonBranchConfigs), ...Object.values(upstashRedisConfigs)],
    environment: {
      ...COMMON_ENV_VARS,
      AXIOM_TOKEN: process.env.AXIOM_TOKEN!,
      AXIOM_DATASET: process.env.AXIOM_DATASET!,
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
        layers: [axiomArm64Layer],
        architecture: Architecture.ARM_64
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
