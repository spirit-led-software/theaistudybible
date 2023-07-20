import { Constants, Database, Queues, STATIC_ENV_VARS } from "@stacks";
import { Api, StackContext, use } from "sst/constructs";

export function API({ stack }: StackContext) {
  const { database } = use(Database);
  const { webpageIndexQueue } = use(Queues);
  const { hostedZone, domainName, websiteUrl } = use(Constants);

  const apiDomainName = `api.${domainName}`;
  const apiUrl = `https://${apiDomainName}`;

  const lambdaEnv: Record<string, string> = {
    DATABASE_RESOURCE_ARN: database.clusterArn,
    DATABASE_SECRET_ARN: database.secretArn,
    DATABASE_NAME: database.defaultDatabaseName,
    WEBSITE_URL: websiteUrl,
    API_URL: apiUrl,
    ...STATIC_ENV_VARS,
  };

  const api = new Api(stack, "api", {
    routes: {
      "POST /scraper/website": {
        function: {
          handler: "packages/functions/src/scraper/website.handler",
          bind: [database, webpageIndexQueue],
          permissions: [database, webpageIndexQueue],
          runtime: "nodejs18.x",
          environment: lambdaEnv,
          timeout: "5 minutes",
        },
      },
      "POST /scraper/webpage": {
        function: {
          handler: "packages/functions/src/scraper/webpage.handler",
          bind: [database],
          permissions: [database],
          runtime: "nodejs18.x",
          nodejs: {
            install: ["@sparticuz/chromium"],
            esbuild: {
              external: ["@sparticuz/chromium"],
            },
          },
          environment: lambdaEnv,
          timeout: "1 minute",
        },
      },
      "GET /session": {
        function: {
          handler: "packages/functions/src/session.handler",
          bind: [database],
          permissions: [database],
          runtime: "nodejs18.x",
          environment: lambdaEnv,
          timeout: "30 seconds",
        },
      },
    },
    customDomain: {
      domainName: apiDomainName,
      hostedZone: hostedZone.zoneName,
    },
    cors: {
      allowOrigins: [websiteUrl],
      allowHeaders: ["*"],
      allowCredentials: true,
    },
  });

  stack.addOutputs({
    "API URL": apiUrl,
  });

  return {
    api,
    apiDomainName,
    apiUrl,
  };
}
