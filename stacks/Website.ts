import { API, Database, S3, STATIC_ENV_VARS } from "@stacks";
import { NextjsSite, StackContext, use } from "sst/constructs";

export function Website({ stack, app }: StackContext) {
  const { database } = use(Database);
  const { bucket } = use(S3);
  const { api, apiUrl } = use(API);

  const domainName = `${
    stack.stage !== "prod" ? `${stack.stage}.` : ""
  }chatesv.com`;

  const websiteUrl =
    stack.stage === "prod" ? `https://${domainName}` : `http://localhost:3000`;

  const website = new NextjsSite(stack, "Website", {
    path: "packages/web",
    bind: [database, api, bucket],
    environment: {
      NEXT_PUBLIC_WEBSITE_URL: websiteUrl,
      NEXT_PUBLIC_API_URL: apiUrl,
      DATABASE_RESOURCE_ARN: database.clusterArn,
      DATABASE_SECRET_ARN: database.secretArn,
      DATABASE_NAME: database.defaultDatabaseName,
      ...STATIC_ENV_VARS,
    },
    customDomain: {
      domainName: domainName,
      hostedZone: "chatesv.com",
    },
    warm: 20,
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
