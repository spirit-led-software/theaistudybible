import { API, DatabaseScripts, STATIC_ENV_VARS, Website } from "@stacks";
import {
  Auth as AuthConstruct,
  StackContext,
  dependsOn,
  use,
} from "sst/constructs";

export function Auth({ stack }: StackContext) {
  dependsOn(DatabaseScripts);

  const { websiteUrl } = use(Website);
  const { api, apiUrl } = use(API);

  const auth = new AuthConstruct(stack, "auth", {
    authenticator: {
      handler: "packages/functions/src/auth.handler",
      environment: {
        WEBSITE_URL: websiteUrl,
        API_URL: apiUrl,
        ...STATIC_ENV_VARS,
      },
      timeout: "30 seconds",
    },
  });

  auth.attach(stack, {
    api,
  });

  return {
    auth,
  };
}
