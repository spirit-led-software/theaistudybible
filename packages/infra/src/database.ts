import { devEmbeddingModel, embeddingModel } from '@theaistudybible/core/model/llm';
import { Constants } from '@theaistudybible/infra';
import { dependsOn, type StackContext } from 'sst/constructs';
import { NeonBranch } from './resources/neon-branch';
import { UpstashRedis } from './resources/upstash-redis';
import { UpstashVector } from './resources/upstash-vector';

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
        autoscaling_limit_max_cu: stack.stage === 'prod' ? 4 : 1,
        suspend_timeout_seconds: 0
      }
    ],
    retainOnDelete: stack.stage === 'prod'
  });
  app.addDefaultFunctionEnv({
    DATABASE_READWRITE_URL: neonBranch.urls.readWriteUrl,
    DATABASE_READONLY_URL: neonBranch.urls.readOnlyUrl
  });

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
  app.addDefaultFunctionEnv({
    UPSTASH_REDIS_URL: upstashRedis.redisUrl,
    UPSTASH_REDIS_REST_URL: upstashRedis.restUrl,
    UPSTASH_REDIS_TOKEN: upstashRedis.restToken,
    UPSTASH_REDIS_READONLY_TOKEN: upstashRedis.readOnlyRestToken
  });

  const resolvedEmbeddingModel = stack.stage === 'prod' ? embeddingModel : devEmbeddingModel;
  const mainIndexName = `main-${embeddingModel.id}`;
  const indexName =
    stack.stage === 'prod' ? mainIndexName : `${stack.stage}-${resolvedEmbeddingModel.id}`;
  const upstashVector = new UpstashVector(stack, 'UpstashVector', {
    email: process.env.UPSTASH_EMAIL!,
    apiKey: process.env.UPSTASH_API_KEY!,
    name: indexName,
    similarityFunction: 'COSINE',
    dimensionCount: resolvedEmbeddingModel.dimensions,
    retainOnDelete: stack.stage === 'prod',
    copyIndex:
      stack.stage === 'prod'
        ? {
            sourceIndexName: mainIndexName,
            numVectors: 100
          }
        : undefined
  });
  app.addDefaultFunctionEnv({
    UPSTASH_VECTOR_REST_URL: upstashVector.restUrl,
    UPSTASH_VECTOR_REST_TOKEN: upstashVector.restToken,
    UPSTASH_VECTOR_READONLY_REST_TOKEN: upstashVector.readOnlyRestToken
  });

  return {
    neonBranch,
    upstashRedis,
    upstashVector
  };
}
