import {
  API,
  COMMON_ENV_VARS,
  ChatAPI,
  Constants,
  Database,
  DatabaseScripts,
  Layers
} from '@revelationsai/infra';
import { Architecture } from 'aws-cdk-lib/aws-lambda';
import { SvelteKitSite, dependsOn, use, type StackContext } from 'sst/constructs';

export function Website({ stack }: StackContext) {
  dependsOn(DatabaseScripts);

  const { hostedZone, domainName, websiteUrl, apiUrl } = use(Constants);
  const { axiomArm64Layer } = use(Layers);
  const { neonBranch, upstashRedis, upstashVector } = use(Database);
  const { api } = use(API);
  const { chatApiUrl } = use(ChatAPI);

  const website = new SvelteKitSite(stack, 'website', {
    path: 'apps/website',
    permissions: [api],
    bind: [api],
    environment: {
      ...COMMON_ENV_VARS,
      DATABASE_READWRITE_URL: neonBranch.urls.readWriteUrl,
      DATABASE_READONLY_URL: neonBranch.urls.readOnlyUrl,
      UPSTASH_REDIS_URL: upstashRedis.redisUrl,
      UPSTASH_REDIS_REST_URL: upstashRedis.restUrl,
      UPSTASH_REDIS_TOKEN: upstashRedis.restToken,
      UPSTASH_REDIS_READONLY_TOKEN: upstashRedis.readOnlyRestToken,
      UPSTASH_VECTOR_REST_URL: upstashVector.restUrl,
      UPSTASH_VECTOR_REST_TOKEN: upstashVector.restToken,
      UPSTASH_VECTOR_READONLY_REST_TOKEN: upstashVector.readOnlyRestToken,
      AXIOM_TOKEN: process.env.AXIOM_TOKEN!,
      AXIOM_DATASET: process.env.AXIOM_DATASET!,
      PUBLIC_WEBSITE_URL: websiteUrl,
      PUBLIC_API_URL: apiUrl,
      PUBLIC_CHAT_API_URL: chatApiUrl
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
