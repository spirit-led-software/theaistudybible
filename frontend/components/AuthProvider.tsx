"use client";

import { apiConfig, websiteConfig } from "@/configs";
import SuperTokensReact, { SuperTokensWrapper } from "supertokens-auth-react";
import SessionReact from "supertokens-auth-react/recipe/session";
import ThirdPartyEmailPassword from "supertokens-auth-react/recipe/thirdpartyemailpassword";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  if (typeof window !== "undefined") {
    SuperTokensReact.init({
      appInfo: {
        appName: "ChatESV",
        apiDomain: apiConfig.apiUrl,
        apiBasePath: `${apiConfig.apiBasePath}/auth`,
        websiteDomain: websiteConfig.websiteUrl,
        websiteBasePath: "/auth",
      },
      recipeList: [SessionReact.init(), ThirdPartyEmailPassword.init({})],
    });
  }
  return <SuperTokensWrapper>{children}</SuperTokensWrapper>;
}
