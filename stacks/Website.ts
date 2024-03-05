import {
  API,
  Auth,
  COMMON_ENV_VARS,
  ChatAPI,
  Constants,
  Database,
  DatabaseScripts,
  Layers
} from '@stacks';
import { Architecture } from 'aws-cdk-lib/aws-lambda';
import { SvelteKitSite, dependsOn, use, type StackContext } from 'sst/constructs';

export function Website({ stack }: StackContext) {
  dependsOn(DatabaseScripts);

  const { hostedZone, domainName, websiteUrl, authUiUrl, apiUrl } = use(Constants);
  const { axiomArm64Layer } = use(Layers);
  const { neonBranchConfigs, upstashRedisConfigs } = use(Database);
  const { auth } = use(Auth);
  const { api } = use(API);
  const { chatApiUrl } = use(ChatAPI);

  const website = new SvelteKitSite(stack, 'website', {
    path: 'packages/website',
    permissions: [api],
    bind: [auth, api, ...Object.values(neonBranchConfigs), ...Object.values(upstashRedisConfigs)],
    environment: {
      ...COMMON_ENV_VARS,
      AXIOM_TOKEN: process.env.AXIOM_TOKEN!,
      AXIOM_DATASET: process.env.AXIOM_DATASET!,
      PUBLIC_WEBSITE_URL: websiteUrl,
      PUBLIC_API_URL: apiUrl,
      PUBLIC_CHAT_API_URL: chatApiUrl,
      PUBLIC_AUTH_URL: authUiUrl
    },
    customDomain: {
      domainName: domainName,
      hostedZone: hostedZone.zoneName
    },
    dev: {
      url: websiteUrl
    },
    cdk: {
      server: {
        layers: [axiomArm64Layer],
        architecture: Architecture.ARM_64
      }
    }
  });
  api.bind([website]);

  stack.addOutputs({
    WebsiteUrl: websiteUrl
  });

  return {
    website,
    websiteUrl
  };
}
