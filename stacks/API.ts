import { Auth, Database, S3, STATIC_ENV_VARS } from "@stacks";
import { LayerVersion } from "aws-cdk-lib/aws-lambda";
import { Api, StackContext, use } from "sst/constructs";

const chromeLayerArn =
  "arn:aws:lambda:us-east-1:764866452798:layer:chrome-aws-lambda:22";

export function API({ stack }: StackContext) {
  const { bucket } = use(S3);
  const { database, databaseUrl } = use(Database);
  const { auth } = use(Auth);

  const chromeLayer = LayerVersion.fromLayerVersionArn(
    stack,
    "Layer",
    chromeLayerArn
  );
  const api = new Api(stack, "api", {
    routes: {
      "POST /scraper/file": "packages/functions/src/scraper/file.handler",
      "POST /scraper/website": "packages/functions/src/scraper/website.handler",
      "POST /scraper/webpage": {
        function: {
          runtime: "nodejs16.x",
          handler: "packages/functions/src/scraper/webpage.handler",
          layers: [chromeLayer],
          nodejs: {
            install: ["chrome-aws-lambda"],
          },
          bind: [bucket, database],
        },
      },
      "GET /session": "packages/functions/src/session.handler",
    },
    defaults: {
      function: {
        runtime: "nodejs18.x",
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
      }api.chatesv.com`,
      hostedZone: "chatesv.com",
    },
  });

  auth.attach(stack, {
    api,
  });

  stack.addOutputs({
    ApiUrl: api.url,
  });

  return {
    api,
  };
}
