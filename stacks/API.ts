import { Constants, Queues, STATIC_ENV_VARS } from "@stacks";
import { Api, StackContext, use } from "sst/constructs";

export function API({ stack }: StackContext) {
  const { webpageIndexQueue } = use(Queues);
  const { hostedZone, domainName, websiteUrl } = use(Constants);

  const apiDomainName = `api.${domainName}`;
  const apiUrl = `https://${apiDomainName}`;

  const lambdaEnv: Record<string, string> = {
    WEBSITE_URL: websiteUrl,
    API_URL: apiUrl,
    ...STATIC_ENV_VARS,
  };

  const api = new Api(stack, "api", {
    routes: {
      "POST /scraper/website": {
        function: {
          handler: "packages/functions/src/scraper/website.handler",
          bind: [webpageIndexQueue],
          permissions: [webpageIndexQueue],
          runtime: "nodejs18.x",
          environment: lambdaEnv,
          timeout: "15 minutes",
          memorySize: "4 GB",
        },
      },
      "POST /scraper/webpage": {
        function: {
          handler: "packages/functions/src/scraper/webpage.handler",
          runtime: "nodejs18.x",
          nodejs: {
            install: ["@sparticuz/chromium"],
            esbuild: {
              external: ["@sparticuz/chromium"],
            },
          },
          environment: lambdaEnv,
          timeout: "15 minutes",
          memorySize: "2 GB",
        },
      },
      "GET /session": {
        function: {
          handler: "packages/functions/src/session.handler",
          runtime: "nodejs18.x",
          environment: lambdaEnv,
          timeout: "30 seconds",
        },
      },
      "POST /stripe/webhook": {
        function: {
          handler: "packages/functions/src/stripe/webhook.handler",
          runtime: "nodejs18.x",
          environment: lambdaEnv,
          timeout: "60 seconds",
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
