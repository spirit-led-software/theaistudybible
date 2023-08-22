import { STATIC_ENV_VARS } from "@stacks";
import { HostedZone } from "aws-cdk-lib/aws-route53";
import { StackContext } from "sst/constructs";

export function Constants({ stack, app }: StackContext) {
  const hostedZone = HostedZone.fromLookup(stack, "hostedZone", {
    domainName: "revelationsai.com",
  });

  const domainName = `${stack.stage !== "prod" ? `${stack.stage}.test.` : ""}${
    hostedZone.zoneName
  }`;

  const providedDevWebsiteUrl = process.env.WEBSITE_URL;
  const websiteUrl =
    app.mode === "dev"
      ? providedDevWebsiteUrl
        ? providedDevWebsiteUrl
        : "https://localhost:3000"
      : `https://${domainName}`;

  if (app.stage !== "prod") {
    app.setDefaultRemovalPolicy("destroy");
  }

  app.setDefaultFunctionProps({
    logRetention: stack.stage === "prod" ? "one_year" : "one_day",
    environment: {
      WEBSITE_URL: websiteUrl,
      ...STATIC_ENV_VARS,
    },
    timeout: "60 seconds",
    runtime: "nodejs18.x",
    architecture: "x86_64",
  });

  return {
    hostedZone,
    domainName,
    websiteUrl,
  };
}
