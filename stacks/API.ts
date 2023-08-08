import {
  Auth,
  Constants,
  DatabaseScripts,
  Queues,
  S3,
  STATIC_ENV_VARS,
} from "@stacks";
import {
  FunctionUrlAuthType,
  HttpMethod,
  InvokeMode,
} from "aws-cdk-lib/aws-lambda";
import { Api, Function, StackContext, dependsOn, use } from "sst/constructs";

export function API({ stack }: StackContext) {
  dependsOn(DatabaseScripts);

  const { webpageIndexQueue } = use(Queues);
  const { hostedZone, domainName, websiteUrl } = use(Constants);
  const { auth } = use(Auth);
  const { devotionImageBucket } = use(S3);

  const apiDomainName = `api.${domainName}`;
  const apiUrl = `https://${apiDomainName}`;

  const lambdaEnv: Record<string, string> = {
    WEBSITE_URL: websiteUrl,
    API_URL: apiUrl,
    ...STATIC_ENV_VARS,
  };

  const chatApiFunction = new Function(stack, "chatApiFunction", {
    handler: "packages/functions/src/chat.handler",
    environment: lambdaEnv,
    timeout: "60 seconds",
    runtime: "nodejs18.x",
    enableLiveDev: false, // Cannot live dev with response stream
  });
  const chatApiFunctionUrl = chatApiFunction.addFunctionUrl({
    invokeMode: InvokeMode.RESPONSE_STREAM,
    cors: {
      allowCredentials: true,
      allowedHeaders: ["*"],
      allowedMethods: [HttpMethod.ALL],
      allowedOrigins: [websiteUrl],
      exposedHeaders: ["*"],
    },
    authType: FunctionUrlAuthType.NONE,
  });

  const api = new Api(stack, "api", {
    routes: {
      "POST /scraper/website": {
        function: {
          handler: "packages/functions/src/scraper/website.handler",
          bind: [webpageIndexQueue],
          permissions: [webpageIndexQueue],
          timeout: "15 minutes",
          memorySize: "4 GB",
        },
      },
      "POST /scraper/webpage": {
        function: {
          handler: "packages/functions/src/scraper/webpage.handler",
          nodejs: {
            install: ["@sparticuz/chromium"],
            esbuild: {
              external: ["@sparticuz/chromium"],
            },
          },
          timeout: "15 minutes",
          memorySize: "2 GB",
        },
      },
      "GET /session": "packages/functions/src/session.handler",
      "POST /stripe/webhook": "packages/functions/src/webhook/stripe.handler",

      // REST API
      // AI Responses
      "GET /ai-responses":
        "packages/functions/src/rest/ai-responses/get.handler",
      "POST /ai-responses":
        "packages/functions/src/rest/ai-responses/post.handler",
      "POST /ai-responses/search":
        "packages/functions/src/rest/ai-responses/search/post.handler",
      "GET /ai-responses/{id}":
        "packages/functions/src/rest/ai-responses/[id]/get.handler",
      "PUT /ai-responses/{id}":
        "packages/functions/src/rest/ai-responses/[id]/put.handler",
      "DELETE /ai-responses/{id}":
        "packages/functions/src/rest/ai-responses/[id]/delete.handler",
      "GET /ai-responses/{id}/source-documents":
        "packages/functions/src/rest/ai-responses/[id]/source-documents/get.handler",

      // Chats
      "GET /chats": "packages/functions/src/rest/chats/get.handler",
      "POST /chats": "packages/functions/src/rest/chats/post.handler",
      "GET /chats/{id}": "packages/functions/src/rest/chats/[id]/get.handler",
      "PUT /chats/{id}": "packages/functions/src/rest/chats/[id]/put.handler",
      "DELETE /chats/{id}":
        "packages/functions/src/rest/chats/[id]/delete.handler",

      // Devotions
      "GET /devotions": "packages/functions/src/rest/devotions/get.handler",
      "POST /devotions": {
        function: {
          handler: "packages/functions/src/rest/devotions/post.handler",
          bind: [devotionImageBucket],
          permissions: [devotionImageBucket],
          environment: {
            ...lambdaEnv,
            DEVOTION_IMAGE_BUCKET: devotionImageBucket.bucketName,
          },
          timeout: "2 minutes",
        },
      },
      "GET /devotions/{id}":
        "packages/functions/src/rest/devotions/[id]/get.handler",
      "PUT /devotions/{id}":
        "packages/functions/src/rest/devotions/[id]/put.handler",
      "DELETE /devotions/{id}":
        "packages/functions/src/rest/devotions/[id]/delete.handler",
      "GET /devotions/{id}/source-documents":
        "packages/functions/src/rest/devotions/[id]/source-documents/get.handler",

      // Index Operations
      "GET /index-operations":
        "packages/functions/src/rest/index-operations/get.handler",
      "GET /index-operations/{id}":
        "packages/functions/src/rest/index-operations/[id]/get.handler",
      "PUT /index-operations/{id}":
        "packages/functions/src/rest/index-operations/[id]/put.handler",
      "DELETE /index-operations/{id}":
        "packages/functions/src/rest/index-operations/[id]/delete.handler",

      // User Messages
      "GET /user-messages":
        "packages/functions/src/rest/user-messages/get.handler",
      "POST /user-messages":
        "packages/functions/src/rest/user-messages/post.handler",
      "GET /user-messages/{id}":
        "packages/functions/src/rest/user-messages/[id]/get.handler",
      "PUT /user-messages/{id}":
        "packages/functions/src/rest/user-messages/[id]/put.handler",
      "DELETE /user-messages/{id}":
        "packages/functions/src/rest/user-messages/[id]/delete.handler",
    },
    defaults: {
      function: {
        environment: lambdaEnv,
        runtime: "nodejs18.x",
        timeout: "60 seconds",
      },
    },
    customDomain: {
      domainName: apiDomainName,
      hostedZone: hostedZone.zoneName,
    },
    cors: {
      allowOrigins: [websiteUrl],
      allowHeaders: ["*"],
      allowMethods: ["ANY"],
      allowCredentials: true,
      exposeHeaders: ["*"],
    },
  });

  auth.attach(stack, {
    api,
  });

  stack.addOutputs({
    ChatApiUrl: chatApiFunctionUrl.url,
    ApiUrl: apiUrl,
  });

  return {
    chatApiFunction,
    chatApiFunctionUrl,
    chatApiUrl: chatApiFunctionUrl.url,
    api,
    apiDomainName,
    apiUrl,
  };
}
