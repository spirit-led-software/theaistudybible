import {
  Constants,
  DatabaseScripts,
  Queues,
  S3,
  STATIC_ENV_VARS,
} from "@stacks";
import { Api, StackContext, dependsOn, use } from "sst/constructs";

export function API({ stack, app }: StackContext) {
  dependsOn(DatabaseScripts);

  const { webpageIndexQueue } = use(Queues);
  const { hostedZone, domainName, websiteUrl, invokeBedrockPolicy } =
    use(Constants);
  const { indexFileBucket } = use(S3);
  const {
    dbReadOnlyUrl,
    dbReadWriteUrl,
    vectorDbReadOnlyUrl,
    vectorDbReadWriteUrl,
  } = use(DatabaseScripts);

  const apiDomainName = `api.${domainName}`;
  const apiUrl = `https://${apiDomainName}`;

  const lambdaEnv: Record<string, string> = {
    ...STATIC_ENV_VARS,
    WEBSITE_URL: websiteUrl,
    API_URL: apiUrl,
    DATABASE_READWRITE_URL: dbReadWriteUrl,
    DATABASE_READONLY_URL: dbReadOnlyUrl,
    VECTOR_DB_READWRITE_URL: vectorDbReadWriteUrl,
    VECTOR_DB_READONLY_URL: vectorDbReadOnlyUrl,
  };

  const api = new Api(stack, "api", {
    routes: {
      "POST /scraper/web-crawl": {
        function: {
          handler: "packages/functions/src/scraper/web-crawl.handler",
          bind: [webpageIndexQueue],
          permissions: [webpageIndexQueue],
          timeout: "15 minutes",
          memorySize: "2 GB",
        },
      },
      "POST /scraper/webpage": {
        function: {
          handler: "packages/functions/src/scraper/webpage/webpage.handler",
          nodejs: {
            install: ["@sparticuz/chromium"],
            esbuild: {
              external: ["@sparticuz/chromium"],
            },
          },
          permissions: [invokeBedrockPolicy],
          timeout: "15 minutes",
          memorySize: "2 GB",
        },
      },
      "POST /scraper/file/presigned-url": {
        function: {
          handler: "packages/functions/src/scraper/file/upload-url.handler",
          bind: [indexFileBucket],
          permissions: [indexFileBucket],
          environment: {
            ...lambdaEnv,
            INDEX_FILE_BUCKET: indexFileBucket.bucketName,
          },
        },
      },
      "POST /scraper/file/remote-download": {
        function: {
          handler:
            "packages/functions/src/scraper/file/remote-download.handler",
          bind: [indexFileBucket],
          permissions: [indexFileBucket],
          environment: {
            ...lambdaEnv,
            INDEX_FILE_BUCKET: indexFileBucket.bucketName,
          },
        },
      },
      "GET /session": {
        function: {
          handler: "packages/functions/src/session.handler",
          memorySize: "512 MB",
        },
      },

      // Webhooks
      "POST /notifications/stripe":
        "packages/functions/src/webhooks/stripe.handler",
      "POST /notifications/revenue-cat":
        "packages/functions/src/webhooks/revenue-cat.handler",

      // Vector similarity search
      "POST /vector-search": {
        function: {
          handler: "packages/functions/src/rest/vector-search/post.handler",
          permissions: [invokeBedrockPolicy],
        },
      },
    },
    defaults: {
      function: {
        environment: lambdaEnv,
        runtime: "nodejs18.x",
        timeout: "60 seconds",
        memorySize: "1 GB",
      },
    },
    customDomain: {
      domainName: apiDomainName,
      hostedZone: hostedZone.zoneName,
    },
    cors: {
      allowCredentials: true,
      allowOrigins: [websiteUrl],
      allowHeaders: ["Authorization", "Content-Type"],
      allowMethods: ["ANY"],
      exposeHeaders: ["*"],
    },
  });

  stack.addOutputs({
    ApiUrl: apiUrl,
  });

  return {
    api,
    apiDomainName,
    apiUrl,
  };
}
