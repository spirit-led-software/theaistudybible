import { SharedStack } from "@stacks";
import { Duration } from "aws-cdk-lib";
import {
  InstanceClass,
  InstanceSize,
  InstanceType,
  Peer,
  Port,
  SecurityGroup,
  SubnetType,
} from "aws-cdk-lib/aws-ec2";
import {
  DatabaseInstance,
  DatabaseInstanceEngine,
  PostgresEngineVersion,
  StorageType,
  SubnetGroup,
} from "aws-cdk-lib/aws-rds";
import { StackContext, use } from "sst/constructs";

export default function DatabaseStack({ stack }: StackContext) {
  const { vpc } = use(SharedStack);

  const securityGroup = new SecurityGroup(
    stack,
    `${stack.stackName}-security-group`,
    {
      vpc,
      allowAllOutbound: true,
    }
  );

  const subnetGroup = new SubnetGroup(
    stack,
    `${stack.stackName}-subnet-group`,
    {
      description: "Database subnet group",
      vpc,
      vpcSubnets: vpc.selectSubnets({
        subnetType: SubnetType.PRIVATE_WITH_EGRESS,
      }),
    }
  );

  const database = new DatabaseInstance(stack, `${stack.stackName}-database`, {
    engine: DatabaseInstanceEngine.postgres({
      version: PostgresEngineVersion.VER_15_3,
    }),
    multiAz: stack.stage === "prod",
    databaseName: "chatesv",
    port: 5432,
    storageType: StorageType.GP2,
    instanceType:
      stack.stage === "prod"
        ? InstanceType.of(InstanceClass.M5, InstanceSize.LARGE)
        : InstanceType.of(InstanceClass.T3, InstanceSize.MICRO),
    allocatedStorage: stack.stage === "prod" ? 50 : 5,
    allowMajorVersionUpgrade: false,
    autoMinorVersionUpgrade: true,
    backupRetention:
      stack.stage === "prod" ? Duration.days(7) : Duration.days(1),
    vpc,
    subnetGroup,
    securityGroups: [securityGroup],
  });

  securityGroup.addIngressRule(
    Peer.ipv4(vpc.vpcCidrBlock),
    Port.tcp(database.instanceEndpoint.port),
    "Allow access from VPC"
  );

  return {
    securityGroup,
    database,
  };
}
