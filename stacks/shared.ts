import { SubnetType, Vpc } from "aws-cdk-lib/aws-ec2";
import { StackContext } from "sst/constructs";

export default function SharedStack({ stack }: StackContext) {
  const vpc = new Vpc(stack, `${stack.stackName}-vpc`, {
    subnetConfiguration: [
      {
        name: "public",
        subnetType: SubnetType.PUBLIC,
        cidrMask: 24,
      },
      {
        name: "private-isolated",
        subnetType: SubnetType.PRIVATE_ISOLATED,
        cidrMask: 24,
      },
      {
        name: "private",
        subnetType: SubnetType.PRIVATE_WITH_EGRESS,
        cidrMask: 24,
      },
    ],
  });

  return {
    vpc,
  };
}
