import { Constants, Database, STATIC_ENV_VARS } from "@stacks";
import {
  Auth as AuthConstruct,
  StackContext,
  dependsOn,
  use,
} from "sst/constructs";

export function Auth({ stack }: StackContext) {
  dependsOn(Database);

  const { websiteUrl } = use(Constants);
  const { dbReadOnlyUrl, dbReadWriteUrl } = use(Database);

  const auth = new AuthConstruct(stack, "auth", {
    authenticator: {
      handler: "packages/functions/src/auth/auth.handler",
      copyFiles: [
        {
          from: "emails",
          to: "emails",
        },
        {
          from: "apple-auth-key.p8",
          to: "apple-auth-key.p8",
        },
      ],
      environment: {
        WEBSITE_URL: websiteUrl,
        DATABASE_READWRITE_URL: dbReadWriteUrl,
        DATABASE_READONLY_URL: dbReadOnlyUrl,
        ...STATIC_ENV_VARS,
      },
      timeout: "30 seconds",
      memorySize: "512 MB",
    },
  });

  return {
    auth,
  };
}
