import { Constants, DatabaseScripts, STATIC_ENV_VARS } from "@stacks";
import {
  Auth as AuthConstruct,
  StackContext,
  dependsOn,
  use,
} from "sst/constructs";

export function Auth({ stack }: StackContext) {
  dependsOn(DatabaseScripts);

  const { websiteUrl } = use(Constants);
  const { dbReadOnlyUrl, dbReadWriteUrl } = use(DatabaseScripts);

  const auth = new AuthConstruct(stack, "auth", {
    authenticator: {
      handler: "packages/functions/src/auth/auth.handler",
      copyFiles: [
        {
          from: "packages/functions/src/auth/emails",
          to: "emails",
        },
      ],
      environment: {
        WEBSITE_URL: websiteUrl,
        DATABASE_READWRITE_URL: dbReadWriteUrl,
        DATABASE_READONLY_URL: dbReadOnlyUrl,
        ...STATIC_ENV_VARS,
      },
      timeout: "30 seconds",
    },
  });

  return {
    auth,
  };
}
