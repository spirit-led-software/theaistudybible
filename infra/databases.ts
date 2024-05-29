import type { EndpointType, Provisioner } from "@neondatabase/api-client";
import * as upstash from "@upstash/pulumi";
import {
  devEmbeddingModel,
  embeddingModel,
} from "../packages/core/src/model/llm";
import { NeonBranch } from "./resources/neon-branch";
import { UpstashVector } from "./resources/upstash-vector";

export const neonBranch = new NeonBranch("NeonBranch", {
  projectName: $app.name,
  branchName: $app.stage === "prod" ? "main" : $app.stage,
  roleName: $app.name,
  endpointOptions: [
    {
      type: "read_write" as EndpointType,
      provisioner: "k8s-neonvm" as Provisioner,
      autoscaling_limit_min_cu: $app.stage === "prod" ? 0.5 : 0.25,
      autoscaling_limit_max_cu: $app.stage === "prod" ? 4 : 1,
      suspend_timeout_seconds: 0,
    },
  ],
  retainOnDelete: $app.stage === "prod",
});
sst.Link.makeLinkable(NeonBranch, function () {
  return {
    properties: {
      readOnlyUrl: this.readOnlyUrl,
      readWriteUrl: this.readWriteUrl,
    },
  };
});

export const upstashRedis = new upstash.RedisDatabase("UpstashRedis", {
  databaseName: $app.stage === "prod" ? "main" : $app.stage,
  region: $app.providers!.aws.region,
  tls: true,
  eviction: true,
  autoScale: $app.stage === "prod",
});
export const upstashRedisUrl = $interpolate`rediss://${upstashRedis.endpoint}:${upstashRedis.port}`;
export const upstashRedisRestUrl = $interpolate`https://${upstashRedis.endpoint}`;
sst.Link.makeLinkable(upstash.RedisDatabase, function () {
  return {
    properties: {
      url: $interpolate`rediss://default:${this.password}@${this.endpoint}:${this.port}`,
      restUrl: $interpolate`https://${this.endpoint}`,
      restToken: this.restToken,
      readOnlyRestToken: this.readOnlyRestToken,
    },
  };
});

const resolvedEmbeddingModel =
  $app.stage === "prod" ? embeddingModel : devEmbeddingModel;
const mainIndexName = `main-${embeddingModel.id}`;
const indexName =
  $app.stage === "prod"
    ? mainIndexName
    : `${$app.stage}-${resolvedEmbeddingModel.id}`;
export const upstashVector = new UpstashVector("UpstashVector", {
  indexName,
  similarityFunction: "COSINE",
  dimensionCount: resolvedEmbeddingModel.dimensions,
  retainOnDelete: $app.stage === "prod",
  copyIndex:
    $app.stage === "prod"
      ? {
          sourceIndexName: mainIndexName,
          numVectors: 100,
        }
      : undefined,
});
sst.Link.makeLinkable(UpstashVector, function () {
  return {
    properties: {
      restUrl: this.restUrl,
      restToken: this.restToken,
      readOnlyRestToken: this.readOnlyRestToken,
    },
  };
});
