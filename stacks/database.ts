import { SharedStack } from "@stacks";
import { SecurityGroup } from "aws-cdk-lib/aws-ec2";
import { RDS, StackContext, use } from "sst/constructs";

export default function DatabaseStack({ stack }: StackContext) {
  const { vpc } = use(SharedStack);

  const securityGroup = new SecurityGroup(
    stack,
    `${stack.stackName}-database-security-group`,
    {
      vpc,
      allowAllOutbound: true,
    }
  );

  const database = new RDS(stack, `${stack.stackName}-database`, {
    engine: "postgresql13.9",
    defaultDatabaseName: "chatesv",
    cdk: {
      cluster: {
        vpc,
        securityGroups: [securityGroup],
      },
    },
  });

  return {
    securityGroup,
    database,
  };
}
