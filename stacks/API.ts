import { Database, S3, STATIC_ENV_VARS } from "@stacks";
import { LayerVersion } from "aws-cdk-lib/aws-lambda";
import { Api, StackContext, use } from "sst/constructs";

const chromeLayerArn =
  "arn:aws:lambda:us-east-1:764866452798:layer:chrome-aws-lambda:22";

export function API({ stack }: StackContext) {
  const { bucket } = use(S3);
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
          runtime: "nodejs16.x",
          handler: "packages/functions/src/scraper/webpage.handler",
          layers: [chromeLayer],
          nodejs: {
            install: ["chrome-aws-lambda"],
          },
        },
      },
    },
    defaults: {
      function: {
        runtime: "nodejs18.x",
        nodejs: {
          install: ["prisma"],
        },
        copyFiles: [
          {
            from: "prisma",
          },
        ],
        environment: {
          DATABASE_URL: databaseUrl,
          ...STATIC_ENV_VARS,
        },
        bind: [database, bucket],
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
