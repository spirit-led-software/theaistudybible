import { Constants, Database, Queues, S3, STATIC_ENV_VARS } from "@stacks";
import { LayerVersion } from "aws-cdk-lib/aws-lambda";
import { Api, StackContext, use } from "sst/constructs";

const chromeLayerArn =
  "arn:aws:lambda:us-east-1:764866452798:layer:chrome-aws-lambda:22";

export function API({ stack }: StackContext) {
  const { indexFileBucket: bucket } = use(S3);
  const { database } = use(Database);
  const { webpageIndexQueue } = use(Queues);
  const { hostedZone, domainName, websiteUrl } = use(Constants);

  const chromeLayer = LayerVersion.fromLayerVersionArn(
    stack,
    "Layer",
    chromeLayerArn
  );

  const apiDomainName = `api.${domainName}`;
  const apiUrl = `https://${apiDomainName}`;

  const api = new Api(stack, "api", {
    routes: {
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
            API_URL: apiUrl,
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
          WEBSITE_URL: websiteUrl,
          API_URL: apiUrl,
          ...STATIC_ENV_VARS,
        },
        bind: [database, bucket, webpageIndexQueue],
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
