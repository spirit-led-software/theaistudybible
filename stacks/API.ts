import {
  Auth,
  Constants,
  Database,
  Queues,
  S3,
  STATIC_ENV_VARS,
} from "@stacks";
import { Fn } from "aws-cdk-lib";
import {
  Certificate,
  CertificateValidation,
} from "aws-cdk-lib/aws-certificatemanager";
import {
  CachePolicy,
  CachedMethods,
  Distribution,
  OriginRequestPolicy,
  ResponseHeadersPolicy,
  ViewerProtocolPolicy,
} from "aws-cdk-lib/aws-cloudfront";
import { HttpOrigin } from "aws-cdk-lib/aws-cloudfront-origins";
import { FunctionUrlAuthType, InvokeMode } from "aws-cdk-lib/aws-lambda";
import { ARecord, AaaaRecord, RecordTarget } from "aws-cdk-lib/aws-route53";
import { Api, Function, StackContext, dependsOn, use } from "sst/constructs";

const CLOUDFRONT_HOSTED_ZONE_ID = "Z2FDTNDATAQYW2";

export function API({ stack }: StackContext) {
  dependsOn(Database);

  const { webpageIndexQueue } = use(Queues);
  const { hostedZone, domainName, domainNamePrefix, websiteUrl } =
    use(Constants);
  const { auth } = use(Auth);
  const { devotionImageBucket } = use(S3);
  const {
    dbReadOnlyUrl,
    dbReadWriteUrl,
    vectorDbReadOnlyUrl,
    vectorDbReadWriteUrl,
  } = use(Database);

  const apiDomainName = `api.${domainName}`;
  const apiUrl = `https://${apiDomainName}`;

  const lambdaEnv: Record<string, string> = {
    WEBSITE_URL: websiteUrl,
    API_URL: apiUrl,
    DATABASE_READWRITE_URL: dbReadWriteUrl,
    DATABASE_READONLY_URL: dbReadOnlyUrl,
    VECTOR_DB_READWRITE_URL: vectorDbReadWriteUrl,
    VECTOR_DB_READONLY_URL: vectorDbReadOnlyUrl,
    ...STATIC_ENV_VARS,
  };

  const chatApiFunction = new Function(stack, "chatApiFunction", {
    handler: "packages/functions/src/chat.handler",
    environment: lambdaEnv,
    timeout: "2 minutes",
    runtime: "nodejs18.x",
    enableLiveDev: false, // Cannot live dev with response stream
    memorySize: "512 MB",
  });
  const chatApiFunctionUrl = chatApiFunction.addFunctionUrl({
    invokeMode: InvokeMode.RESPONSE_STREAM,
    authType: FunctionUrlAuthType.NONE,
  });
  const chatApiUrlDistribution = new Distribution(
    stack,
    "chatApiUrlDistribution",
    {
      defaultBehavior: {
        origin: new HttpOrigin(
          Fn.select(2, Fn.split("/", chatApiFunctionUrl.url))
        ),
        viewerProtocolPolicy: ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        originRequestPolicy: OriginRequestPolicy.CORS_CUSTOM_ORIGIN,
        cachedMethods: CachedMethods.CACHE_GET_HEAD_OPTIONS,
        cachePolicy: CachePolicy.CACHING_OPTIMIZED,
        allowedMethods: {
          methods: ["HEAD", "DELETE", "POST", "GET", "OPTIONS", "PUT", "PATCH"],
        },
        responseHeadersPolicy: new ResponseHeadersPolicy(
          stack,
          "chatApiUrlDistResponseHeadersPolicy",
          {
            corsBehavior: {
              originOverride: true,
              accessControlAllowCredentials: true,
              accessControlAllowHeaders: ["Authorization", "Content-type"],
              accessControlAllowMethods: ["POST", "OPTIONS"],
              accessControlAllowOrigins: [websiteUrl],
              accessControlExposeHeaders: [
                "x-chat-id",
                "x-user-message-id",
                "x-ai-response-id",
                "content-type",
                "content-length",
              ],
            },
          }
        ),
      },
      domainNames: [`chat.${apiDomainName}`],
      certificate: new Certificate(stack, "chatApiUrlCertificate", {
        domainName: `chat.${apiDomainName}`,
        validation: CertificateValidation.fromDns(hostedZone),
      }),
    }
  );
  const chatApiUrlARecord = new ARecord(stack, "chatApiUrlARecord", {
    zone: hostedZone,
    recordName: `chat.api${domainNamePrefix ? `.${domainNamePrefix}` : ""}`,
    target: RecordTarget.fromAlias({
      bind: () => ({
        dnsName: chatApiUrlDistribution.distributionDomainName,
        hostedZoneId: CLOUDFRONT_HOSTED_ZONE_ID,
      }),
    }),
  });
  const chatApiUrlAAAARecord = new AaaaRecord(stack, "chatApiUrlAAAARecord", {
    zone: hostedZone,
    recordName: `chat.api${domainNamePrefix ? `.${domainNamePrefix}` : ""}`,
    target: RecordTarget.fromAlias({
      bind: () => ({
        dnsName: chatApiUrlDistribution.distributionDomainName,
        hostedZoneId: CLOUDFRONT_HOSTED_ZONE_ID,
      }),
    }),
  });
  chatApiUrlAAAARecord.node.addDependency(chatApiUrlARecord);
  const chatApiUrl = `https://${chatApiUrlAAAARecord.domainName}`;

  const api = new Api(stack, "api", {
    routes: {
      "POST /scraper/website": {
        function: {
          handler: "packages/functions/src/scraper/website.handler",
          bind: [webpageIndexQueue],
          permissions: [webpageIndexQueue],
          timeout: "15 minutes",
          memorySize: "2 GB",
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
          memorySize: "1 GB",
        },
      },
      "GET /session": "packages/functions/src/session.handler",

      "POST /notifications/stripe":
        "packages/functions/src/webhooks/stripe.handler",
      "POST /notifications/revenue-cat":
        "packages/functions/src/webhooks/revenue-cat.handler",

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

      // AI Response Source Documents
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
          timeout: "5 minutes",
        },
      },
      "GET /devotions/{id}":
        "packages/functions/src/rest/devotions/[id]/get.handler",
      "PUT /devotions/{id}":
        "packages/functions/src/rest/devotions/[id]/put.handler",
      "DELETE /devotions/{id}":
        "packages/functions/src/rest/devotions/[id]/delete.handler",

      // Devotion Source Documents
      "GET /devotions/{id}/source-documents":
        "packages/functions/src/rest/devotions/[id]/source-documents/get.handler",

      // Devotion Reactions
      "GET /devotions/{id}/reactions":
        "packages/functions/src/rest/devotions/[id]/reactions/get.handler",
      "POST /devotions/{id}/reactions":
        "packages/functions/src/rest/devotions/[id]/reactions/post.handler",
      "GET /devotions/{id}/reactions/counts":
        "packages/functions/src/rest/devotions/[id]/reactions/counts/get.handler",

      // Devotion Images
      "GET /devotions/{id}/images":
        "packages/functions/src/rest/devotions/[id]/images/get.handler",

      // Index Operations
      "GET /index-operations":
        "packages/functions/src/rest/index-operations/get.handler",
      "POST /index-operations/search":
        "packages/functions/src/rest/index-operations/search/post.handler",
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
      "POST /user-messages/search":
        "packages/functions/src/rest/user-messages/search/post.handler",
      "GET /user-messages/{id}":
        "packages/functions/src/rest/user-messages/[id]/get.handler",
      "PUT /user-messages/{id}":
        "packages/functions/src/rest/user-messages/[id]/put.handler",
      "DELETE /user-messages/{id}":
        "packages/functions/src/rest/user-messages/[id]/delete.handler",

      // Users
      "GET /users": "packages/functions/src/rest/users/get.handler",
      "GET /users/{id}": "packages/functions/src/rest/users/[id]/get.handler",
      "PUT /users/{id}": "packages/functions/src/rest/users/[id]/put.handler",
      "DELETE /users/{id}":
        "packages/functions/src/rest/users/[id]/delete.handler",

      // Current user
      "GET /users/me": "packages/functions/src/rest/users/me/get.handler",
      "PUT /users/me": "packages/functions/src/rest/users/me/put.handler",
      "DELETE /users/me": "packages/functions/src/rest/users/me/delete.handler",

      // User query counts
      "GET /users/{id}/query-counts":
        "packages/functions/src/rest/users/[id]/query-counts/get.handler",
      "GET /users/me/query-counts":
        "packages/functions/src/rest/users/me/query-counts/get.handler",

      // Vector similarity search
      "POST /vector-search":
        "packages/functions/src/rest/vector-search/post.handler",
    },
    defaults: {
      function: {
        environment: lambdaEnv,
        runtime: "nodejs18.x",
        timeout: "60 seconds",
        memorySize: "256 MB",
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

  auth.attach(stack, {
    api,
  });

  stack.addOutputs({
    ChatApiUrl: chatApiUrl,
    ApiUrl: apiUrl,
  });

  return {
    chatApiFunction,
    chatApiFunctionUrl,
    chatApiUrl,
    api,
    apiDomainName,
    apiUrl,
  };
}
