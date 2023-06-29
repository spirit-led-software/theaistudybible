import { AuthStack, SharedStack } from "@stacks";
import { SecretValue } from "aws-cdk-lib";
import * as ecrAssets from "aws-cdk-lib/aws-ecr-assets";
import * as ecs from "aws-cdk-lib/aws-ecs";
import * as elasticache from "aws-cdk-lib/aws-elasticache";
import * as elbv2 from "aws-cdk-lib/aws-elasticloadbalancingv2";
import * as iam from "aws-cdk-lib/aws-iam";
import * as route53 from "aws-cdk-lib/aws-route53";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as secretsManager from "aws-cdk-lib/aws-secretsmanager";
import { Bucket, RDS, StackContext, use } from "sst/constructs";

type ReturnType = {
  role: iam.Role;
  database: RDS;
  s3Bucket: Bucket;
  cache: elasticache.CfnCacheCluster;
};

export function BackendStack({ stack }: StackContext): ReturnType {
  const { vpc, role, database, cluster } = use(SharedStack);

  const { loadBalancer: authLb, apiKey: authApiKey } = use(AuthStack);

  const cache = new elasticache.CfnCacheCluster(
    stack,
    `${stack.stackName}-cache`,
    {
      engine: "redis",
      engineVersion: "7.0",
      cacheNodeType: "cache.t4g.micro",
      numCacheNodes: 1,
    }
  );

  const s3Bucket = new Bucket(stack, `${stack.stackName}-bucket`, {
    name: "chatesv-index-files",
    cdk: {
      bucket: {
        accessControl: s3.BucketAccessControl.PUBLIC_READ_WRITE,
      },
    },
  });

  const adminPassword = new secretsManager.Secret(
    stack,
    `${stack.stackName}-admin-password`,
    {
      generateSecretString: {
        excludeCharacters: '"@/\\',
      },
    }
  );

  const llmApiKey = new secretsManager.Secret(
    stack,
    `${stack.stackName}-llm-api-key`,
    {
      secretStringValue: SecretValue.unsafePlainText(process.env.LLM_API_KEY),
    }
  );

  const vectorDbApiKey = new secretsManager.Secret(
    stack,
    `${stack.stackName}-vector-db-api-key`,
    {
      secretStringValue: SecretValue.unsafePlainText(
        process.env.VECTOR_DB_API_KEY
      ),
    }
  );

  const bucketGroup = new iam.Group(stack, `${stack.stackName}-bucket-group`, {
    groupName: "bucket-group",
    managedPolicies: [
      {
        managedPolicyArn:
          iam.ManagedPolicy.fromAwsManagedPolicyName("AmazonS3FullAccess")
            .managedPolicyArn,
      },
    ],
  });

  const bucketUser = new iam.User(stack, `${stack.stackName}-bucket-user`, {
    userName: "bucket-user",
    groups: [bucketGroup],
  });

  const bucketAccessKey = new iam.CfnAccessKey(
    stack,
    `${stack.stackName}-bucket-access-key`,
    {
      userName: bucketUser.userName,
    }
  );

  const imageAsset = new ecrAssets.DockerImageAsset(
    stack,
    `${stack.stackName}-image`,
    {
      directory: "packages/backend",
      file: "Dockerfile",
    }
  );

  const taskDef = new ecs.FargateTaskDefinition(
    stack,
    `${stack.stackName}-task-def`,
    {
      cpu: 256,
      memoryLimitMiB: 512,
      taskRole: role,
    }
  );
  taskDef.addContainer("backend", {
    image: ecs.ContainerImage.fromDockerImageAsset(imageAsset),
    portMappings: [
      {
        name: "http",
        containerPort: 8080,
      },
    ],
    environment: {
      PORT: "8080",
      WEBSITE_URL: "https://chatesv.com",
      API_URL: "https://api.chatesv.com",
      API_BASE_PATH: "",
      AUTH_CONNECTION_URI: authLb.loadBalancerDnsName,
      AUTH_API_KEY: authApiKey.secretValue.toString(),
      AUTH_ADMIN_EMAIL: "admin@chatesv.com",
      AUTH_ADMIN_PASSWORD: adminPassword.secretValue.toString(),
      LLM_API_KEY: llmApiKey.secretValue.toString(),
      LLM_TEMPERATURE: process.env.LLM_TEMPERATURE,
      LLM_MODEL_NAME: process.env.LLM_MODEL_NAME,
      VECTOR_DB_TYPE: "qdrant",
      VECTOR_DB_SCHEME: "https",
      VECTOR_DB_HOST: process.env.VECTOR_DB_HOST,
      VECTOR_DB_PORT: process.env.VECTOR_DB_PORT,
      VECTOR_DB_API_KEY: vectorDbApiKey.secretValue.toString(),
      VECTOR_DB_COLLECTION_NAME: "chatesv",
      VECTOR_DB_COLLECTION_DIMENSIONS:
        process.env.VECTOR_DB_COLLECTION_DIMENSIONS,
      DATABASE_TYPE: "postgres",
      DATABASE_HOST: database.cdk.cluster.clusterEndpoint.hostname,
      DATABASE_PORT: database.cdk.cluster.clusterEndpoint.port.toString(),
      DATABASE_NAME: database.defaultDatabaseName,
      DATABASE_USERNAME: database.cdk.cluster.secret
        .secretValueFromJson("username")
        .toString(),
      DATABASE_PASSWORD: database.cdk.cluster.secret
        .secretValueFromJson("password")
        .toString(),
      RUN_DATABASE_MIGRATIONS: "true",
      WEB_SCRAPER_THREADS: "4",
      REDIS_HOST: cache.attrRedisEndpointAddress,
      REDIS_PORT: cache.attrRedisEndpointPort,
      S3_BUCKET_NAME: s3Bucket.bucketName,
      S3_BUCKET_REGION: stack.region,
      S3_ACCESS_KEY_ID: bucketAccessKey.ref,
      S3_SECRET_ACCESS_KEY: bucketAccessKey.attrSecretAccessKey,
    },
  });

  const service = new ecs.FargateService(stack, `${stack.stackName}-service`, {
    cluster,
    taskDefinition: taskDef,
    assignPublicIp: true,
    serviceConnectConfiguration: {
      namespace: "chatesv",
      services: [
        {
          discoveryName: "backend",
          portMappingName: "http",
          port: 8080,
        },
      ],
    },
  });

  const loadBalancer = new elbv2.ApplicationLoadBalancer(
    stack,
    `${stack.stackName}-lb`,
    {
      vpc,
      internetFacing: true,
    }
  );

  const listener = loadBalancer.addListener("Listener", {
    port: 443,
    certificates: [elbv2.ListenerCertificate.fromArn(process.env.CERT_ARN)],
    open: true,
  });
  listener.addTargets("Target", {
    port: 8080,
    targets: [service],
    protocol: elbv2.ApplicationProtocol.HTTP,
  });

  const hostedZone = route53.HostedZone.fromLookup(
    stack,
    `${stack.stackName}-hosted-zone`,
    {
      domainName: "chatesv.com",
    }
  );

  const cnameRecord = new route53.CnameRecord(
    stack,
    `${stack.stackName}-cname`,
    {
      zone: hostedZone,
      recordName: stack.stage === "prod" ? "api" : `${stack.stage}-api`,
      deleteExisting: true,
      domainName: loadBalancer.loadBalancerDnsName,
    }
  );

  stack.addOutputs({
    ApiUrl: `https://${cnameRecord.domainName}/api`,
  });

  return {
    database,
    cache,
    s3Bucket,
    role,
  };
}
