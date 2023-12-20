import { API, COMMON_ENV_VARS, ChatAPI, Constants, DatabaseScripts, Layers, S3 } from '@stacks';
import { Architecture } from 'aws-cdk-lib/aws-lambda';
import { SvelteKitSite, dependsOn, use, type StackContext } from 'sst/constructs';

export function Website({ stack }: StackContext) {
  dependsOn(DatabaseScripts);

  const { axiomLayer } = use(Layers);
  const { indexFileBucket } = use(S3);
  const { api } = use(API);
  const { chatApiUrl } = use(ChatAPI);
  const { hostedZone, domainName, websiteUrl, authUiUrl, apiUrl } = use(Constants);

  const website = new SvelteKitSite(stack, 'website', {
    path: 'packages/website',
    bind: [api, indexFileBucket],
    permissions: [api, indexFileBucket],
    environment: {
      ...COMMON_ENV_VARS,
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
        layers: [axiomLayer],
        architecture: Architecture.X86_64
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
