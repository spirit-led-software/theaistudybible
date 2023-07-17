import { API, Database, S3, STATIC_ENV_VARS } from "@stacks";
import { NextjsSite, StackContext, use } from "sst/constructs";

export function Website({ stack }: StackContext) {
  const { database } = use(Database);
  const { bucket } = use(S3);
  const { api } = use(API);

  const domainName = `${
    stack.stage !== "prod" ? `${stack.stage}.` : ""
  }chatesv.com`;

  const website = new NextjsSite(stack, "Website", {
    path: "packages/web",
    bind: [database, api, bucket],
    environment: {
      NEXT_PUBLIC_WEBSITE_URL: `https://${domainName}`,
      NEXT_PUBLIC_API_URL: api.url,
      DATABASE_RESOURCE_ARN: database.clusterArn,
      DATABASE_SECRET_ARN: database.secretArn,
      DATABASE_NAME: database.defaultDatabaseName,
      ...STATIC_ENV_VARS,
    },
    customDomain: {
      domainName: domainName,
      hostedZone: "chatesv.com",
    },
    dev: {
      deploy: true,
    },
  });

  stack.addOutputs({
    "Website URL": `https://${domainName}`,
  });

  return {
    website,
  };
}
