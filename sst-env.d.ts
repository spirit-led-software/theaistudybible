/* This file is auto-generated by SST. Do not edit. */
/* tslint:disable */
/* eslint-disable */
import "sst"
export {}
declare module "sst" {
  export interface Resource {
    "AdminEmail": {
      "type": "sst.sst.Secret"
      "value": string
    }
    "AdminPassword": {
      "type": "sst.sst.Secret"
      "value": string
    }
    "AnthropicApiKey": {
      "type": "sst.sst.Secret"
      "value": string
    }
    "BibleBucket": {
      "name": string
      "type": "sst.aws.Bucket"
    }
    "Cdn": {
      "type": "sst.aws.Router"
      "url": string
    }
    "Database": {
      "name": string
      "token": string
      "type": "sst.sst.Linkable"
      "url": string
    }
    "Dev": {
      "type": "sst.sst.Linkable"
      "value": string
    }
    "DevotionImagesBucket": {
      "name": string
      "type": "sst.aws.Bucket"
    }
    "Domain": {
      "type": "sst.sst.Linkable"
      "value": string
    }
    "Email": {
      "sender": string
      "type": "sst.aws.Email"
    }
    "EmailQueue": {
      "type": "sst.aws.Queue"
      "url": string
    }
    "GeneratedImagesBucket": {
      "name": string
      "type": "sst.aws.Bucket"
    }
    "OpenAiApiKey": {
      "type": "sst.sst.Secret"
      "value": string
    }
    "ProfileImagesBucket": {
      "name": string
      "type": "sst.aws.Bucket"
    }
    "Stage": {
      "type": "sst.sst.Linkable"
      "value": string
    }
    "StripePublishableKey": {
      "type": "sst.sst.Linkable"
      "value": string
    }
    "StripeSecretKey": {
      "type": "sst.sst.Secret"
      "value": string
    }
    "StripeWebhookSecret": {
      "type": "sst.sst.Secret"
      "value": string
    }
    "UpstashRedis": {
      "redisUrl": string
      "restToken": string
      "restUrl": string
      "type": "upstash.index/redisDatabase.RedisDatabase"
    }
    "UpstashVectorIndex": {
      "readOnlyRestToken": string
      "restToken": string
      "restUrl": string
      "type": "upstash.index/vectorIndex.VectorIndex"
    }
    "WebApp": {
      "type": "sst.aws.SolidStart"
      "url": string
    }
    "WebhooksApi": {
      "type": "sst.sst.Linkable"
      "url": string
    }
    "WebhooksApiFunction": {
      "name": string
      "type": "sst.aws.Function"
      "url": string
    }
    "WebhooksApiRouter": {
      "type": "sst.aws.Router"
      "url": string
    }
  }
}
