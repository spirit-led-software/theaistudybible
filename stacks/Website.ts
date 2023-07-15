import { API, Database, S3, STATIC_ENV_VARS } from "@stacks";
import { NextjsSite, StackContext, use } from "sst/constructs";

export function Website({ stack }: StackContext) {
  const { database, databaseUrl } = use(Database);
  const { bucket } = use(S3);
  const { scraperApi } = use(API);

  const website = new NextjsSite(stack, "Website", {
    path: "packages/web",
    bind: [database, scraperApi, bucket],
    environment: {
      DATABASE_URL: databaseUrl,
      NEXT_PUBLIC_WEBSITE_URL: `https://${
        stack.stage !== "prod" ? `${stack.stage}.` : ""
      }chatesv.com`,
      NEXT_PUBLIC_SCRAPER_API_URL: scraperApi.url,
      NEXT_AUTH_URL: scraperApi.url,
      ...STATIC_ENV_VARS,
    },
    customDomain: {
      domainName: `${
        stack.stage !== "prod" ? `${stack.stage}.` : ""
      }chatesv.com`,
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
