import { HostedZone } from "aws-cdk-lib/aws-route53";
import { StackContext } from "sst/constructs";

export function Constants({ stack }: StackContext) {
  const hostedZone = HostedZone.fromLookup(stack, "hostedZone", {
    domainName: "chatesv.com",
  });

  const domainName = `${stack.stage !== "prod" ? `${stack.stage}.` : ""}${
    hostedZone.zoneName
  }`;

  const websiteUrl =
    stack.stage === "prod" ? `https://${domainName}` : `http://localhost:3000`;

  return {
    hostedZone,
    domainName,
    websiteUrl,
  };
}
