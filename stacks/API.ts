import {
  Auth,
  Constants,
  DatabaseScripts,
  Queues,
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
      "GET /session": {
        function: {
          handler: "packages/functions/src/session.handler",
        },
      },
      "POST /stripe/webhook": {
        function: {
          handler: "packages/functions/src/stripe/webhook.handler",
          timeout: "60 seconds",
        },
      },
    },
    defaults: {
      function: {
        environment: lambdaEnv,
        runtime: "nodejs18.x",
        timeout: "30 seconds",
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
