import { SharedStack } from "@stacks";
import { SecurityGroup } from "aws-cdk-lib/aws-ec2";
import { CfnCacheCluster, CfnSubnetGroup } from "aws-cdk-lib/aws-elasticache";
import { StackContext, use } from "sst/constructs";

export default function CacheStack({ stack }: StackContext) {
  const { vpc } = use(SharedStack);

  const securityGroup = new SecurityGroup(
    stack,
    `${stack.stackName}-cache-security-group`,
    {
      vpc,
      allowAllOutbound: true,
    }
  );
  const subnetGroup = new CfnSubnetGroup(
    stack,
    `${stack.stackName}-cache-subnet-group`,
    {
      description: "Cache subnet group",
      subnetIds: vpc.privateSubnets.map((subnet) => subnet.subnetId),
    }
  );
  const cache = new CfnCacheCluster(stack, `${stack.stackName}-cache`, {
    engine: "redis",
    engineVersion: "7.0",
    port: 6379,
    cacheNodeType: stack.stage === "prod" ? "cache.t3.small" : "cache.t2.micro",
    numCacheNodes: 1,
    vpcSecurityGroupIds: [securityGroup.securityGroupId],
    cacheSubnetGroupName: subnetGroup.ref,
    autoMinorVersionUpgrade: true,
    preferredMaintenanceWindow: "sun:05:00-sun:06:00",
  });

  return {
    securityGroup,
    subnetGroup,
    cache,
  };
}
