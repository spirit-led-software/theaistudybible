import { API, Constants, DatabaseScripts, S3, STATIC_ENV_VARS } from "@stacks";
import { NextjsSite, StackContext, dependsOn, use } from "sst/constructs";

export function Website({ stack }: StackContext) {
  dependsOn(DatabaseScripts);

  const { indexFileBucket, devotionImageBucket } = use(S3);
  const { api, apiUrl, chatApiUrl } = use(API);
  const { hostedZone, domainName, websiteUrl } = use(Constants);
  const {
    dbReadOnlyUrl,
    dbReadWriteUrl,
    vectorDbReadOnlyUrl,
    vectorDbReadWriteUrl,
  } = use(DatabaseScripts);

  const website = new NextjsSite(stack, "website", {
    path: "packages/web",
    bind: [api, indexFileBucket, devotionImageBucket],
    permissions: [api, indexFileBucket, devotionImageBucket],
    environment: {
      NEXT_PUBLIC_WEBSITE_URL: websiteUrl,
      NEXT_PUBLIC_API_URL: apiUrl,
      NEXT_PUBLIC_CHAT_API_URL: chatApiUrl,
      INDEX_FILE_BUCKET: indexFileBucket.bucketName,
      DEVOTION_IMAGE_BUCKET: devotionImageBucket.bucketName,
      DATABASE_READWRITE_URL: dbReadWriteUrl,
      DATABASE_READONLY_URL: dbReadOnlyUrl ?? dbReadWriteUrl,
      VECTOR_DB_READWRITE_URL: vectorDbReadWriteUrl,
      VECTOR_DB_READONLY_URL: vectorDbReadOnlyUrl ?? vectorDbReadWriteUrl,
      ...STATIC_ENV_VARS,
    },
    customDomain: {
      domainName: domainName,
      hostedZone: hostedZone.zoneName,
    },
    dev: {
      url: websiteUrl,
    },
    warm: stack.stage === "prod" ? 25 : undefined,
  });

  api.bind([website]);

  stack.addOutputs({
    WebsiteUrl: websiteUrl,
  });

  return {
    website,
    websiteUrl,
  };
}
