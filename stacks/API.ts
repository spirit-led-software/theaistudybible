import { Database, STATIC_ENV_VARS } from "@stacks";
import { LayerVersion } from "aws-cdk-lib/aws-lambda";
import { Api, StackContext, use } from "sst/constructs";

const chromeLayerArn =
  "arn:aws:lambda:us-east-1:764866452798:layer:chrome-aws-lambda:22";

export function API({ stack }: StackContext) {
  const { database, databaseUrl } = use(Database);

  const chromeLayer = LayerVersion.fromLayerVersionArn(
    stack,
    "Layer",
    chromeLayerArn
  );
  const scraperApi = new Api(stack, "ScraperApi", {
    routes: {
      "POST /file": "packages/functions/src/scraper/file.handler",
      "POST /website": "packages/functions/src/scraper/website.handler",
      "POST /webpage": {
        function: {
          handler: "packages/functions/src/scraper/webpage.handler",
          timeout: 15,
          layers: [chromeLayer],
          nodejs: {
            install: ["chrome-aws-lambda"],
          },
        },
      },
    },
    defaults: {
      function: {
        environment: {
          DATABASE_URL: databaseUrl,
          ...STATIC_ENV_VARS,
        },
        bind: [database],
      },
    },
    customDomain: {
      domainName: `${
        stack.stage !== "prod" ? `${stack.stage}.` : ""
      }chatesv.com`,
      hostedZone: "chatesv.com",
      path: "api/scraper",
    },
  });

  stack.addOutputs({
    ScraperApiUrl: scraperApi.url,
  });

  return {
    scraperApi,
  };
}
