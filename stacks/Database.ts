import { Constants } from '@stacks';
import { Config, dependsOn, type StackContext } from 'sst/constructs';
import { NeonBranch } from './resources/NeonBranch';
import { UpstashRedis } from './resources/UpstashRedis';

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
    DATABASE_READWRITE_URL: neonBranch.urls.dbReadWriteUrl,
    DATABASE_READONLY_URL: neonBranch.urls.dbReadOnlyUrl,
    VECTOR_DB_READWRITE_URL: neonBranch.urls.vectorDbReadWriteUrl,
    VECTOR_DB_READONLY_URL: neonBranch.urls.vectorDbReadOnlyUrl
  });
  app.addDefaultFunctionBinding(Object.values(neonBranchConfigs));

  const upstashRedis = new UpstashRedis(stack, 'UpstashRedis', {
    email: process.env.UPSTASH_EMAIL!,
    apiKey: process.env.UPSTASH_API_KEY!,
    name: stack.stage === 'prod' ? 'main' : stack.stage,
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

  return {
    neonBranch,
    neonBranchConfigs,
    upstashRedis,
    upstashRedisConfigs
  };
}
