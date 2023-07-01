import { SharedStack } from "@stacks";
import { Peer, Port, SecurityGroup } from "aws-cdk-lib/aws-ec2";
import { CfnCacheCluster, CfnSubnetGroup } from "aws-cdk-lib/aws-elasticache";
import { LogGroup } from "aws-cdk-lib/aws-logs";
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

  const slowLogGroup = new LogGroup(
    stack,
    `${stack.stackName}-cache-slow-log-group`,
    {
      logGroupName: `/aws/elasticache/redis/${stack.stackName}-cache/redis-slow-log`,
      retention: stack.stage === "prod" ? 7 : 1,
    }
  );

  const engineLogGroup = new LogGroup(
    stack,
    `${stack.stackName}-cache-engine-log-group`,
    {
      logGroupName: `/aws/elasticache/redis/${stack.stackName}-cache/redis-engine-log`,
      retention: stack.stage === "prod" ? 7 : 1,
    }
  );

  const cache = new CfnCacheCluster(stack, `${stack.stackName}-cache`, {
    engine: "redis",
    engineVersion: "7.0",
    port: 6379,
    cacheNodeType:
      stack.stage === "prod" ? "cache.t3.medium" : "cache.t3.micro",
    numCacheNodes: 1,
    vpcSecurityGroupIds: [securityGroup.securityGroupId],
    cacheSubnetGroupName: subnetGroup.ref,
    autoMinorVersionUpgrade: true,
    preferredMaintenanceWindow: "sun:05:00-sun:06:00",
    logDeliveryConfigurations: [
      {
        logFormat: "json",
        logType: "slow-log",
        creationStack: [],
        destinationDetails: {
          cloudWatchLogsDetails: {
            logGroup: slowLogGroup.logGroupName,
          },
        },
        destinationType: "cloudwatch-logs",
      },
      {
        logFormat: "json",
        logType: "engine-log",
        creationStack: [],
        destinationDetails: {
          cloudWatchLogsDetails: {
            logGroup: engineLogGroup.logGroupName,
          },
        },
        destinationType: "cloudwatch-logs",
      },
    ],
  });

  securityGroup.addIngressRule(
    Peer.ipv4(vpc.vpcCidrBlock),
    Port.tcp(cache.port),
    "Allow access from VPC"
  );

  return {
    securityGroup,
    subnetGroup,
    cache,
  };
}
