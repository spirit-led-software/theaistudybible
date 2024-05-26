import type { EndpointType, Provisioner } from '@neondatabase/api-client';
import { devEmbeddingModel, embeddingModel } from '@theaistudybible/core/model/llm';
import * as upstash from '@upstash/pulumi';
import { NeonBranch } from './resources/neon-branch';
import { UpstashVector } from './resources/upstash-vector';

export const neonBranch = new NeonBranch('NeonBranch', {
  projectName: $app.name,
  branchName: $app.stage === 'prod' ? 'main' : $app.stage,
  roleName: $app.name,
  endpointOptions: [
    {
      type: 'read_write' as EndpointType,
      provisioner: 'k8s-neonvm' as Provisioner,
      autoscaling_limit_min_cu: $app.stage === 'prod' ? 0.5 : 0.25,
      autoscaling_limit_max_cu: $app.stage === 'prod' ? 4 : 1,
      suspend_timeout_seconds: 0
    }
  ],
  retainOnDelete: $app.stage === 'prod'
});
$transform(sst.aws.Function, (args) => {
  args.environment = $resolve([args.environment]).apply(([environment]) => ({
    ...environment,
    DATABASE_READWRITE_URL: neonBranch.readWriteUrl,
    DATABASE_READONLY_URL: neonBranch.readOnlyUrl
  }));
});

export const upstashRedis = new upstash.RedisDatabase('UpstashRedis', {
  databaseName: $app.stage === 'prod' ? 'main' : $app.stage,
  region: $app.providers!.aws.region,
  tls: true,
  eviction: true,
  autoScale: $app.stage === 'prod'
});
$transform(sst.aws.Function, (args) => {
  args.environment = $resolve([args.environment]).apply(([environment]) => ({
    ...environment,
    UPSTASH_REDIS_URL: `rediss://${upstashRedis.endpoint}:${upstashRedis.port}`,
    UPSTASH_REDIS_REST_URL: `https://${upstashRedis.endpoint}`,
    UPSTASH_REDIS_TOKEN: upstashRedis.restToken,
    UPSTASH_REDIS_READONLY_TOKEN: upstashRedis.readOnlyRestToken
  }));
});

const resolvedEmbeddingModel = $app.stage === 'prod' ? embeddingModel : devEmbeddingModel;
const mainIndexName = `main-${embeddingModel.id}`;
const indexName =
  $app.stage === 'prod' ? mainIndexName : `${$app.stage}-${resolvedEmbeddingModel.id}`;
export const upstashVector = new UpstashVector('UpstashVector', {
  indexName,
  similarityFunction: 'COSINE',
  dimensionCount: resolvedEmbeddingModel.dimensions,
  retainOnDelete: $app.stage === 'prod',
  copyIndex:
    $app.stage === 'prod'
      ? {
          sourceIndexName: mainIndexName,
          numVectors: 100
        }
      : undefined
});
$transform(sst.aws.Function, (args) => {
  args.environment = $resolve([args.environment]).apply(([environment]) => ({
    ...environment,
    UPSTASH_VECTOR_REST_URL: upstashVector.restUrl,
    UPSTASH_VECTOR_REST_TOKEN: upstashVector.restToken,
    UPSTASH_VECTOR_READONLY_REST_TOKEN: upstashVector.readOnlyRestToken
  }));
});
