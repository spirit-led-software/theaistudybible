import { API, Constants, DatabaseScripts, S3, STATIC_ENV_VARS } from "@stacks";
import { SvelteKitSite, StackContext, dependsOn, use } from "sst/constructs";

export function Website({ stack }: StackContext) {
  dependsOn(DatabaseScripts);

  const { indexFileBucket } = use(S3);
  const { api, apiUrl, chatApiUrl } = use(API);
  const { hostedZone, domainName, websiteUrl } = use(Constants);

  const website = new SvelteKitSite(stack, "website", {
    path: "packages/website",
    bind: [api, indexFileBucket],
    permissions: [api, indexFileBucket],
    environment: {
      PUBLIC_WEBSITE_URL: websiteUrl,
      PUBLIC_API_URL: apiUrl,
      PUBLIC_CHAT_API_URL: chatApiUrl,
      ...STATIC_ENV_VARS,
    },
    customDomain: {
      domainName: domainName,
      hostedZone: hostedZone.zoneName,
    },
    dev: {
      url: websiteUrl,
    },
  });

  api.bind([website]);

  stack.addOutputs({
    WebsiteUrl: websiteUrl,
  });

  return {
    website,
    websiteUrl,
  };
}
