import {
  Cpu,
  Memory,
  Service,
  Source,
  VpcConnector,
} from "@aws-cdk/aws-apprunner-alpha";
import { CacheStack, DatabaseStack, S3Stack, SharedStack } from "@stacks";
import { SecretValue } from "aws-cdk-lib";
import { SecurityGroup } from "aws-cdk-lib/aws-ec2";
import { DockerImageAsset, Platform } from "aws-cdk-lib/aws-ecr-assets";
import {
  PolicyDocument,
  PolicyStatement,
  Role,
  ServicePrincipal,
} from "aws-cdk-lib/aws-iam";
import { CnameRecord, HostedZone } from "aws-cdk-lib/aws-route53";
import { Secret } from "aws-cdk-lib/aws-secretsmanager";
import { StackContext, use } from "sst/constructs";

export default function BackendStack({ stack }: StackContext) {
  const { vpc } = use(SharedStack);
  const { database, securityGroup: dbSecurityGroup } = use(DatabaseStack);
  const { cache, securityGroup: cacheSecurityGroup } = use(CacheStack);
  const { bucket } = use(S3Stack);

  const role = new Role(stack, `${stack.stackName}-role`, {
    assumedBy: new ServicePrincipal("tasks.apprunner.amazonaws.com"),
    inlinePolicies: {
      [`${stack.stackName}-policy`]: new PolicyDocument({
        statements: [
          new PolicyStatement({
            actions: ["logs:*"],
            resources: ["*"],
          }),
          new PolicyStatement({
            actions: ["secretsmanager:*"],
            resources: ["*"],
          }),
          new PolicyStatement({
            actions: ["elasticache:*"],
            resources: ["*"],
          }),
          new PolicyStatement({
            actions: ["ecr:*"],
            resources: ["*"],
          }),
          new PolicyStatement({
            actions: ["rds:*"],
            resources: [database.clusterArn, `${database.clusterArn}/*`],
          }),
          new PolicyStatement({
            actions: ["s3:*"],
            resources: [bucket.bucketArn, `${bucket.bucketArn}/*`],
          }),
          new PolicyStatement({
            actions: ["apprunner:*"],
            resources: ["*"],
          }),
        ],
      }),
    },
  });

  const adminPassword = new Secret(stack, `${stack.stackName}-admin-password`, {
    secretStringValue: SecretValue.unsafePlainText(
      process.env.AUTH_ADMIN_PASSWORD
    ),
  });

  const llmApiKey = new Secret(stack, `${stack.stackName}-llm-api-key`, {
    secretStringValue: SecretValue.unsafePlainText(process.env.LLM_API_KEY),
  });

  const vectorDbApiKey = new Secret(
    stack,
    `${stack.stackName}-vector-db-api-key`,
    {
      secretStringValue: SecretValue.unsafePlainText(
        process.env.VECTOR_DB_API_KEY
      ),
    }
  );

  const authApiKey = new Secret(stack, `${stack.stackName}-auth-api-key`, {
    secretStringValue: SecretValue.unsafePlainText(process.env.AUTH_API_KEY),
  });

  const asset = new DockerImageAsset(stack, `${stack.stackName}-image`, {
    directory: "packages/backend",
    platform: Platform.LINUX_AMD64,
    exclude: ["node_modules", "dist"],
  });

  const securityGroup = new SecurityGroup(
    stack,
    `${stack.stackName}-security-group`,
    {
      vpc,
      allowAllOutbound: true,
    }
  );

  const vpcConnector = new VpcConnector(
    stack,
    `${stack.stackName}-vpc-connector`,
    {
      vpc,
      securityGroups: [securityGroup, dbSecurityGroup, cacheSecurityGroup],
    }
  );

  const backend = new Service(stack, `${stack.stackName}-app`, {
    instanceRole: role,
    vpcConnector,
    cpu: stack.stage === "prod" ? Cpu.ONE_VCPU : Cpu.HALF_VCPU,
    memory: stack.stage === "prod" ? Memory.TWO_GB : Memory.ONE_GB,
    source: Source.fromAsset({
      asset,
      imageConfiguration: {
        port: 8080,
        environmentVariables: {
          NODE_ENV: stack.stage === "prod" ? "production" : "development",
          PORT: "8080",
          WEBSITE_URL: `https://${stack.stage}.chatesv.com`,
          API_URL: `https://${stack.stage}.api.chatesv.com`,
          AUTH_CONNECTION_URI: process.env.AUTH_CONNECTION_URI,
          AUTH_API_KEY: authApiKey.secretValue.toString(),
          AUTH_ADMIN_EMAIL: process.env.AUTH_ADMIN_EMAIL,
          AUTH_ADMIN_PASSWORD: adminPassword.secretValue.toString(),
          LLM_API_KEY: llmApiKey.secretValue.toString(),
          LLM_TEMPERATURE: process.env.LLM_TEMPERATURE,
          LLM_MODEL_NAME: process.env.LLM_MODEL_NAME,
          VECTOR_DB_TYPE: "qdrant",
          VECTOR_DB_SCHEME: "https",
          VECTOR_DB_HOST: process.env.VECTOR_DB_HOST,
          VECTOR_DB_PORT: process.env.VECTOR_DB_PORT,
          VECTOR_DB_API_KEY: vectorDbApiKey.secretValue.toString(),
          VECTOR_DB_COLLECTION_NAME: stack.stackName,
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
          S3_BUCKET_NAME: bucket.bucketName,
          S3_BUCKET_REGION: stack.region,
        },
      },
    }),
  });
  backend.node.addDependency(cache);
  backend.node.addDependency(database);
  backend.node.addDependency(bucket);

  const hostedZone = HostedZone.fromLookup(
    stack,
    `${stack.stackName}-hosted-zone`,
    {
      domainName: "chatesv.com",
    }
  );

  const cnameRecord = new CnameRecord(stack, `${stack.stackName}-cname`, {
    zone: hostedZone,
    recordName: stack.stage === "prod" ? "api" : `${stack.stage}.api`,
    deleteExisting: true,
    domainName: backend.serviceUrl,
  });

  stack.addOutputs({
    ApiUrl: `https://${cnameRecord.domainName}`,
  });

  return {
    backend,
  };
}
