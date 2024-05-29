/* tslint:disable */
/* eslint-disable */
import "sst"
declare module "sst" {
  export interface Resource {
    NeonBranch: {
      readOnlyUrl: string
      readWriteUrl: string
      type: "pulumi-nodejs.dynamic/theaistudybible.NeonBranch"
    }
    UpstashRedis: {
      readOnlyRestToken: string
      restToken: string
      restUrl: string
      type: "upstash.index/redisDatabase.RedisDatabase"
      url: string
    }
    UpstashVector: {
      readOnlyRestToken: string
      restToken: string
      restUrl: string
      type: "pulumi-nodejs.dynamic/theaistudybible.UpstashVector"
    }
  }
}
export {}