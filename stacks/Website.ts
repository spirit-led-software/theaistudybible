import { API, Constants, DatabaseScripts, S3, STATIC_ENV_VARS } from "@stacks";
import { NextjsSite, StackContext, dependsOn, use } from "sst/constructs";

export function Website({ stack, app }: StackContext) {
  dependsOn(DatabaseScripts);

  const { indexFileBucket } = use(S3);
  const { api, apiUrl } = use(API);
  const { hostedZone, domainName, websiteUrl } = use(Constants);

  const website = new NextjsSite(stack, "website", {
    path: "packages/web",
    bind: [api, indexFileBucket],
    permissions: [api, indexFileBucket],
    environment: {
      NEXT_PUBLIC_WEBSITE_URL: websiteUrl,
      NEXT_PUBLIC_API_URL: apiUrl,
      INDEX_FILE_BUCKET: indexFileBucket.bucketName,
      ...STATIC_ENV_VARS,
    },
    customDomain: {
      domainName: domainName,
      hostedZone: hostedZone.zoneName,
    },
    dev: {
      url: websiteUrl,
    },
    warm: 5,
  });

  api.bind([website]);

  stack.addOutputs({
    "Website URL": websiteUrl,
  });

  return {
    website,
    websiteUrl,
  };
}
