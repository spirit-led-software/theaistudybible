import { API, Database, STATIC_ENV_VARS, Website } from "@stacks";
import { Auth as AuthConstruct, StackContext, use } from "sst/constructs";

export function Auth({ stack }: StackContext) {
  const { database } = use(Database);
  const { websiteUrl } = use(Website);
  const { api, apiUrl } = use(API);

  const auth = new AuthConstruct(stack, "Auth", {
    authenticator: {
      handler: "packages/functions/src/auth.handler",
      environment: {
        DATABASE_RESOURCE_ARN: database.clusterArn,
        DATABASE_SECRET_ARN: database.secretArn,
        DATABASE_NAME: database.defaultDatabaseName,
        WEBSITE_URL: websiteUrl,
        API_URL: apiUrl,
        ...STATIC_ENV_VARS,
      },
    },
  });

  auth.attach(stack, {
    api,
  });

  return {
    auth,
  };
}
