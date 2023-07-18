import { Database, S3, STATIC_ENV_VARS } from "@stacks";
import { LayerVersion } from "aws-cdk-lib/aws-lambda";
import { Api, StackContext, use } from "sst/constructs";
import { Queue } from "./Queue";

const chromeLayerArn =
  "arn:aws:lambda:us-east-1:764866452798:layer:chrome-aws-lambda:22";

export function API({ stack }: StackContext) {
  const { bucket } = use(S3);
  const { database } = use(Database);
  const { webpageIndexQueue } = use(Queue);

  const chromeLayer = LayerVersion.fromLayerVersionArn(
    stack,
    "Layer",
    chromeLayerArn
  );

  const domainName = `${
    stack.stage !== "prod" ? `${stack.stage}.` : ""
  }api.chatesv.com`;
  const apiUrl = `https://${domainName}`;

  const websiteDomainName = `${
    stack.stage !== "prod" ? `${stack.stage}.` : ""
  }chatesv.com`;
  const websiteUrl =
    stack.stage === "prod"
      ? `https://${websiteDomainName}`
      : `http://localhost:3000`;

  const api = new Api(stack, "api", {
    routes: {
      "POST /scraper/file": "packages/functions/src/scraper/file.handler",
      "POST /scraper/website": "packages/functions/src/scraper/website.handler",
      "POST /scraper/webpage": {
        function: {
          handler: "packages/functions/src/scraper/webpage.handler",
          layers: [chromeLayer],
          nodejs: {
            install: ["chrome-aws-lambda"],
          },
          environment: {
            DATABASE_RESOURCE_ARN: database.clusterArn,
            DATABASE_SECRET_ARN: database.secretArn,
            DATABASE_NAME: database.defaultDatabaseName,
            WEBSITE_URL: websiteUrl,
            API_URL: `https://${domainName}`,
            ...STATIC_ENV_VARS,
          },
          bind: [bucket, database],
        },
      },
      "GET /session": "packages/functions/src/session.handler",
    },
    defaults: {
      function: {
        environment: {
          DATABASE_RESOURCE_ARN: database.clusterArn,
          DATABASE_SECRET_ARN: database.secretArn,
          DATABASE_NAME: database.defaultDatabaseName,
          WEBSITE_URL: `https://${websiteDomainName}`,
          API_URL: `https://${domainName}`,
          ...STATIC_ENV_VARS,
        },
        bind: [database, bucket, webpageIndexQueue],
      },
    },
    customDomain: {
      domainName: domainName,
      hostedZone: "chatesv.com",
    },
    cors: {
      allowOrigins: [`${websiteUrl}`],
      allowHeaders: ["*"],
      allowCredentials: true,
    },
  });

  stack.addOutputs({
    "API URL": apiUrl,
  });

  return {
    api,
    apiUrl,
  };
}
