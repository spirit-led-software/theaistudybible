import { STATIC_ENV_VARS } from "@stacks";
import { HostedZone } from "aws-cdk-lib/aws-route53";
import { StackContext } from "sst/constructs";

export function Constants({ stack, app }: StackContext) {
  const hostedZone = HostedZone.fromLookup(stack, "hostedZone", {
    domainName: "revelationsai.com",
  });

  const domainName = `${stack.stage !== "prod" ? `${stack.stage}.` : ""}${
    hostedZone.zoneName
  }`;

  const websiteUrl =
    stack.stage === "prod" ? `https://${domainName}` : `http://localhost:3000`;

  app.setDefaultFunctionProps({
    environment: {
      WEBSITE_URL: websiteUrl,
      ...STATIC_ENV_VARS,
    },
    timeout: "60 seconds",
  });

  return {
    hostedZone,
    domainName,
    websiteUrl,
  };
}
