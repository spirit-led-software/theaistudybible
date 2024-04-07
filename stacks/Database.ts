import { Constants } from '@stacks';
import { Config, dependsOn, type StackContext } from 'sst/constructs';
import { NeonBranch } from './resources/NeonBranch';
import { UpstashRedis } from './resources/UpstashRedis';
import { UpstashVector } from './resources/UpstashVector';

export function Database({ stack, app }: StackContext) {
  dependsOn(Constants);

  const neonBranch = new NeonBranch(stack, 'NeonBranch', {
    apiKey: process.env.NEON_API_KEY!,
    projectName: app.name,
    branchName: stack.stage === 'prod' ? 'main' : stack.stage,
    roleName: app.name,
    endpointOptions: [
      {
        type: 'read_write',
        provisioner: 'k8s-neonvm',
        autoscaling_limit_min_cu: stack.stage === 'prod' ? 0.5 : 0.25,
        autoscaling_limit_max_cu: stack.stage === 'prod' ? 7 : 1,
        suspend_timeout_seconds: 0
      }
    ],
    retainOnDelete: stack.stage === 'prod'
  });
  const neonBranchConfigs = Config.Parameter.create(stack, {
    DATABASE_READWRITE_URL: neonBranch.urls.readWriteUrl,
    DATABASE_READONLY_URL: neonBranch.urls.readOnlyUrl
  });
  app.addDefaultFunctionBinding(Object.values(neonBranchConfigs));

  const upstashRedis = new UpstashRedis(stack, 'UpstashRedis', {
    email: process.env.UPSTASH_EMAIL!,
    apiKey: process.env.UPSTASH_API_KEY!,
    name: stack.stage === 'prod' ? 'main' : stack.stage,
    // @ts-expect-error - Region is a string in SST
    region: app.region,
    tls: true,
    eviction: true,
    autoUpgrade: true,
    retainOnDelete: stack.stage === 'prod'
  });
  const upstashRedisConfigs = Config.Parameter.create(stack, {
    UPSTASH_REDIS_URL: upstashRedis.redisUrl,
    UPSTASH_REDIS_REST_URL: upstashRedis.restUrl,
    UPSTASH_REDIS_TOKEN: upstashRedis.restToken,
    UPSTASH_REDIS_READONLY_TOKEN: upstashRedis.readOnlyRestToken
  });
  app.addDefaultFunctionBinding(Object.values(upstashRedisConfigs));

  const upstashVector = new UpstashVector(stack, 'UpstashVector', {
    email: process.env.UPSTASH_EMAIL!,
    apiKey: process.env.UPSTASH_API_KEY!,
    name: stack.stage === 'prod' ? 'main' : stack.stage,
    similarityFunction: 'COSINE',
    dimensionCount: 1536,
    retainOnDelete: stack.stage === 'prod',
    copyIndex:
      stack.stage === 'prod'
        ? {
            sourceIndexName: 'main',
            numVectors: 100
          }
        : undefined
  });
  const upstashVectorConfigs = Config.Parameter.create(stack, {
    UPSTASH_VECTOR_REST_URL: upstashVector.restUrl,
    UPSTASH_VECTOR_REST_TOKEN: upstashVector.restToken,
    UPSTASH_VECTOR_READONLY_REST_TOKEN: upstashVector.readOnlyRestToken
  });
  app.addDefaultFunctionBinding(Object.values(upstashVectorConfigs));

  return {
    neonBranch,
    neonBranchConfigs,
    upstashRedis,
    upstashRedisConfigs,
    upstashVector,
    upstashVectorConfigs
  };
}
