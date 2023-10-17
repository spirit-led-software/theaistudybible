import { STATIC_ENV_VARS } from "@stacks";
import { Effect, PolicyStatement } from "aws-cdk-lib/aws-iam";
import { HostedZone } from "aws-cdk-lib/aws-route53";
import { StackContext } from "sst/constructs";

export function Constants({ stack, app }: StackContext) {
  const hostedZone = HostedZone.fromLookup(stack, "hostedZone", {
    domainName: "revelationsai.com",
  });

  const domainNamePrefix = `${
    stack.stage !== "prod" ? `${stack.stage}.test` : ""
  }`;
  const domainName = `${
    domainNamePrefix.length > 0 ? `${domainNamePrefix}.` : ""
  }${hostedZone.zoneName}`;

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
    environment: {
      WEBSITE_URL: websiteUrl,
      ...STATIC_ENV_VARS,
    },
    timeout: "60 seconds",
    runtime: "nodejs18.x",
    architecture: "x86_64",
  });

  const invokeBedrockPolicy = new PolicyStatement({
    effect: Effect.ALLOW,
    actions: ["bedrock:InvokeModel", "bedrock:InvokeModelWithResponseStream"],
    resources: ["*"],
  });

  return {
    hostedZone,
    domainName,
    domainNamePrefix,
    websiteUrl,
    invokeBedrockPolicy,
  };
}
