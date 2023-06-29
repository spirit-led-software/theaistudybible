import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as ecs from "aws-cdk-lib/aws-ecs";
import * as iam from "aws-cdk-lib/aws-iam";
import { RDS, StackContext } from "sst/constructs";

type ReturnType = {
  vpc: ec2.Vpc;
  role: iam.Role;
  cluster: ecs.Cluster;
  database: RDS;
};

export function SharedStack({ stack }: StackContext): ReturnType {
  const vpc = new ec2.Vpc(stack, `${stack.stackName}-vpc`, {
    subnetConfiguration: [
      {
        name: "public",
        subnetType: ec2.SubnetType.PUBLIC,
        cidrMask: 24,
      },
      {
        name: "private-isolated",
        subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
        cidrMask: 24,
      },
      {
        name: "private",
        subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        cidrMask: 24,
      },
    ],
  });

  const cluster = new ecs.Cluster(stack, `${stack.stackName}-cluster`, {
    vpc,
    defaultCloudMapNamespace: {
      name: "chatesv",
    },
  });

  const role = new iam.Role(stack, `${stack.stackName}-apprunner-role`, {
    assumedBy: new iam.ServicePrincipal("ecs-tasks.amazonaws.com"),
    description: `${stack.stackName}-ecs-role`,
    inlinePolicies: {
      [`${stack.stackName}-ecs-policy`]: new iam.PolicyDocument({
        statements: [
          new iam.PolicyStatement({
            actions: [
              "ecr:GetAuthorizationToken",
              "ecr:InitiateLayerUpload",
              "ecr:UploadLayerPart",
              "ecr:CompleteLayerUpload",
              "ecr:PutImage",
              "ecr:BatchGetImage",
              "ecr:BatchCheckLayerAvailability",
            ],
            resources: ["*"],
          }),
          new iam.PolicyStatement({
            actions: [
              "ecs:ListTaskDefinitions",
              "ecs:DescribeTasks",
              "ecs:RunTask",
            ],
            resources: ["*"],
          }),
        ],
      }),
    },
  });

  const database = new RDS(stack, "database", {
    engine: "postgresql13.9",
    defaultDatabaseName: "chatesv",
    cdk: {
      cluster: {
        vpc,
      },
    },
  });

  return {
    vpc,
    role,
    cluster,
    database,
  };
}
