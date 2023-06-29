import { SharedStack } from "@stacks";
import * as ecs from "aws-cdk-lib/aws-ecs";
import * as elbv2 from "aws-cdk-lib/aws-elasticloadbalancingv2";
import * as secretsmanager from "aws-cdk-lib/aws-secretsmanager";
import { StackContext, use } from "sst/constructs";

type ReturnType = {
  apiKey: secretsmanager.Secret;
  loadBalancer: elbv2.ApplicationLoadBalancer;
  app: ecs.FargateService;
};

export function AuthStack({ stack }: StackContext): ReturnType {
  const { vpc, role, database, cluster } = use(SharedStack);

  const apiKey = new secretsmanager.Secret(
    stack,
    `${stack.stackName}-api-key`,
    {
      secretName: `${stack.stackName}-api-key`,
      generateSecretString: {
        excludeCharacters: '"@/\\',
        excludePunctuation: true,
      },
    }
  );

  const taskDef = new ecs.FargateTaskDefinition(
    stack,
    `${stack.stackName}-task-def`,
    {
      cpu: stack.stage === "prod" ? 1024 : 512,
      memoryLimitMiB: stack.stage === "prod" ? 2048 : 1024,
      taskRole: role,
    }
  );
  taskDef.addContainer(`${stack.stackName}-container`, {
    image: ecs.ContainerImage.fromRegistry(
      "registry.supertokens.io/supertokens/supertokens-postgresql:6.0"
    ),
    portMappings: [
      {
        name: "http",
        containerPort: 3567,
      },
    ],
    environment: {
      POSTGRESQL_HOST: database.clusterEndpoint.hostname,
      POSTGRESQL_PORT: database.clusterEndpoint.port.toString(),
      POSTGRESQL_DATABASE_NAME: database.defaultDatabaseName,
      POSTGRESQL_USER: database.cdk.cluster.secret
        .secretValueFromJson("username")
        .toString(),
      POSTGRESQL_PASSWORD: database.cdk.cluster.secret
        .secretValueFromJson("password")
        .toString(),
      API_KEYS: apiKey.secretValue.toString(),
    },
  });

  const app = new ecs.FargateService(stack, `${stack.stackName}-service`, {
    cluster,
    taskDefinition: taskDef,
    serviceConnectConfiguration: {
      services: [
        {
          discoveryName: "auth",
          portMappingName: "http",
          port: 3567,
        },
      ],
    },
  });

  const loadBalancer = new elbv2.ApplicationLoadBalancer(
    stack,
    `${stack.stackName}-lb`,
    {
      vpc,
      internetFacing: false,
    }
  );

  const listener = loadBalancer.addListener(`${stack.stackName}-listener`, {
    port: 80,
    open: true,
  });
  listener.addTargets(`${stack.stackName}-target`, {
    port: 3567,
    targets: [app],
    protocol: elbv2.ApplicationProtocol.HTTP,
  });

  return {
    apiKey,
    loadBalancer,
    app,
  };
}
