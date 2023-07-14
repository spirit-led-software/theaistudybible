import { LayerVersion } from "aws-cdk-lib/aws-lambda";
import { Api, StackContext, use } from "sst/constructs";
import { Database } from "./Database";

const chromeLayerArn =
  "arn:aws:lambda:us-east-1:764866452798:layer:chrome-aws-lambda:22";

export function API({ stack }: StackContext) {
  const { database, databaseUrl } = use(Database);

  const chromeLayer = LayerVersion.fromLayerVersionArn(
    stack,
    "Layer",
    chromeLayerArn
  );
  const webpageScraperApi = new Api(stack, "webpage-scraper-api", {
    routes: {
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
        },
        bind: [database],
      },
    },
    customDomain: {
      domainName: `${stack.stage}.chatesv.com`,
      path: "api/scraper",
    },
  });

  const websiteScraperApi = new Api(stack, "website-scraper-api", {
    routes: {
      "POST /website": "packages/functions/src/scraper/website.handler",
    },
    defaults: {
      function: {
        environment: {
          DATABASE_URL: databaseUrl,
        },
        bind: [webpageScraperApi, database],
      },
    },
    customDomain: {
      domainName: `${stack.stage}.chatesv.com`,
      path: "api/scraper",
    },
  });

  stack.addOutputs({
    DatabaseEndpoint: JSON.stringify(database.clusterEndpoint),
    WebsiteScraperApiUrl: websiteScraperApi.url,
    WebpageScraperApiUrl: webpageScraperApi.url,
  });
}
