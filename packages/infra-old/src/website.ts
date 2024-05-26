import {
  Buckets,
  COMMON_ENV_VARS,
  ChatAPI,
  Constants,
  Database,
  DatabaseScripts,
  Layers,
  Queues
} from '@theaistudybible/infra';
import { Architecture } from 'aws-cdk-lib/aws-lambda';
import { SvelteKitSite, dependsOn, use, type StackContext } from 'sst/constructs';

export function Website({ stack }: StackContext) {
  dependsOn(DatabaseScripts);

  const { hostedZone, domainName, websiteUrl } = use(Constants);
  const { chromiumLayer } = use(Layers);
  const { neonBranch, upstashRedis, upstashVector } = use(Database);
  const { chatApiUrl } = use(ChatAPI);
  const { indexFileBucket, publicBucket } = use(Buckets);
  const { webpageScraperQueue: webpageIndexQueue } = use(Queues);

  const website = new SvelteKitSite(stack, 'website', {
    path: 'apps/website',
    bind: [webpageIndexQueue, indexFileBucket, publicBucket],
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
      PUBLIC_WEBSITE_URL: websiteUrl,
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
        layers: [chromiumLayer],
        architecture: Architecture.ARM_64
      }
    }
  });

  stack.addOutputs({
    WebsiteUrl: websiteUrl
  });

  return {
    website,
    websiteUrl
  };
}
