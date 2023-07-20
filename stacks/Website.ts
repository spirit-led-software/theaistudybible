import { API, Constants, Database, S3, STATIC_ENV_VARS } from "@stacks";
import { NextjsSite, StackContext, use } from "sst/constructs";

export function Website({ stack, app }: StackContext) {
  const { database } = use(Database);
  const { indexFileBucket } = use(S3);
  const { api, apiUrl } = use(API);
  const { hostedZone, domainName, websiteUrl } = use(Constants);

  const website = new NextjsSite(stack, "website", {
    path: "packages/web",
    bind: [database, api, indexFileBucket],
    environment: {
      NEXT_PUBLIC_WEBSITE_URL: websiteUrl,
      NEXT_PUBLIC_API_URL: apiUrl,
      DATABASE_RESOURCE_ARN: database.clusterArn,
      DATABASE_SECRET_ARN: database.secretArn,
      DATABASE_NAME: database.defaultDatabaseName,
      INDEX_FILE_BUCKET: indexFileBucket.bucketName,
      ...STATIC_ENV_VARS,
    },
    customDomain: {
      domainName: domainName,
      hostedZone: hostedZone.zoneName,
    },
    dev: {
      url: websiteUrl,
    },
  });

  api.bind([website]);

  stack.addOutputs({
    "Website URL": websiteUrl,
  });

  return {
    website,
    websiteUrl,
  };
}
