/* tslint:disable */
/* eslint-disable */
import "sst"
declare module "sst" {
  export interface Resource {
    IndexFileBucket: {
      name: string
      type: "sst.aws.Bucket"
    }
    NeonBranch: {
      readOnlyUrl: string
      readWriteUrl: string
      type: "pulumi-nodejs.dynamic/theaistudybible.NeonBranch"
    }
    PublicBucket: {
      name: string
      type: "sst.aws.Bucket"
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
    WebpageScraperQueue: {
      type: "sst.aws.Queue"
      url: string
    }
  }
}
export {}