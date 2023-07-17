import { API, Database, S3, STATIC_ENV_VARS } from "@stacks";
import { NextjsSite, StackContext, use } from "sst/constructs";

export function Website({ stack }: StackContext) {
  const { database, databaseUrl } = use(Database);
  const { bucket } = use(S3);
  const { api } = use(API);

  const domainName = `${
    stack.stage !== "prod" ? `${stack.stage}.` : ""
  }chatesv.com`;

  const website = new NextjsSite(stack, "Website", {
    path: "packages/web",
    bind: [database, api, bucket],
    permissions: [database, api, bucket],
    environment: {
      DATABASE_URL: databaseUrl,
      NEXT_PUBLIC_WEBSITE_URL: domainName,
      NEXT_PUBLIC_API_URL: api.url,
      NEXT_AUTH_URL: domainName,
      ...STATIC_ENV_VARS,
    },
    customDomain: {
      domainName: domainName,
      hostedZone: "chatesv.com",
    },
  });

  stack.addOutputs({
    WebsiteUrl: website.url,
  });

  return {
    website,
  };
}
