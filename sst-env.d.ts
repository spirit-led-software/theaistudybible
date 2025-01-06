/* This file is auto-generated by SST. Do not edit. */
/* tslint:disable */
/* eslint-disable */
/* deno-fmt-ignore-file */
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
    "AnalyticsApi": {
      "type": "sst.sst.Linkable"
      "url": string
    }
    "AnalyticsApiRouter": {
      "type": "sst.aws.Router"
      "url": string
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
    "ChapterMessageBucket": {
      "name": string
      "type": "sst.aws.Bucket"
    }
    "Database": {
      "name": string
      "token": string
      "type": "sst.sst.Linkable"
      "url": string
    }
    "DeadLetterQueue": {
      "type": "sst.aws.Queue"
      "url": string
    }
    "Dev": {
      "type": "asb.asb.Constant"
      "value": string
    }
    "DevotionImagesBucket": {
      "name": string
      "type": "sst.aws.Bucket"
    }
    "Domain": {
      "type": "asb.asb.Constant"
      "value": string
    }
    "Email": {
      "configSet": string
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
    "GroqApiKey": {
      "type": "sst.sst.Secret"
      "value": string
    }
    "IndexBibleChapterQueue": {
      "type": "sst.aws.Queue"
      "url": string
    }
    "IndexBibleQueue": {
      "type": "sst.aws.Queue"
      "url": string
    }
    "OpenAiApiKey": {
      "type": "sst.sst.Secret"
      "value": string
    }
    "PostHogApiHost": {
      "type": "asb.asb.Constant"
      "value": string
    }
    "PostHogApiKey": {
      "type": "asb.asb.Constant"
      "value": string
    }
    "PostHogAssetsHost": {
      "type": "asb.asb.Constant"
      "value": string
    }
    "PostHogUiHost": {
      "type": "asb.asb.Constant"
      "value": string
    }
    "ProfileImagesBucket": {
      "name": string
      "type": "sst.aws.Bucket"
    }
    "ProfileImagesQueue": {
      "type": "sst.aws.Queue"
      "url": string
    }
    "SentryAuthToken": {
      "type": "sst.sst.Secret"
      "value": string
    }
    "Stage": {
      "type": "asb.asb.Constant"
      "value": string
    }
    "StripePublishableKey": {
      "type": "asb.asb.Constant"
      "value": string
    }
    "StripeSecretKey": {
      "type": "sst.sst.Secret"
      "value": string
    }
    "StripeWebhookEndpoint": {
      "secret": string
      "type": "stripe.index/webhookEndpoint.WebhookEndpoint"
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
    "VapidPrivateKey": {
      "type": "sst.sst.Secret"
      "value": string
    }
    "VapidPublicKey": {
      "type": "asb.asb.Constant"
      "value": string
    }
    "Vpc-eu-west-1": {
      "type": "sst.aws.Vpc"
    }
    "Vpc-us-east-1": {
      "type": "sst.aws.Vpc"
    }
    "WebAppApi-eu-west-1": {
      "type": "sst.aws.ApiGatewayV2"
      "url": string
    }
    "WebAppApi-us-east-1": {
      "type": "sst.aws.ApiGatewayV2"
      "url": string
    }
    "WebAppBucket-1736178140823": {
      "name": string
      "type": "sst.aws.Bucket"
    }
    "WebAppBucket-1736179310658": {
      "name": string
      "type": "sst.aws.Bucket"
    }
    "WebAppBucket-1736179645047": {
      "name": string
      "type": "sst.aws.Bucket"
    }
    "WebAppBucket-1736180103001": {
      "name": string
      "type": "sst.aws.Bucket"
    }
    "WebAppBucket-1736180674922": {
      "name": string
      "type": "sst.aws.Bucket"
    }
    "WebAppBucket-1736181107122": {
      "name": string
      "type": "sst.aws.Bucket"
    }
    "WebAppBucket-1736182552644": {
      "name": string
      "type": "sst.aws.Bucket"
    }
    "WebAppBucket-1736182950515": {
      "name": string
      "type": "sst.aws.Bucket"
    }
    "WebAppBucket-1736185322585": {
      "name": string
      "type": "sst.aws.Bucket"
    }
    "WebAppBucket-1736186904363": {
      "name": string
      "type": "sst.aws.Bucket"
    }
    "WebAppBucket-1736187453464": {
      "name": string
      "type": "sst.aws.Bucket"
    }
    "WebAppBucket-1736188024248": {
      "name": string
      "type": "sst.aws.Bucket"
    }
    "WebAppBucket-1736189350104": {
      "name": string
      "type": "sst.aws.Bucket"
    }
    "WebAppCdnLoggingBucket": {
      "name": string
      "type": "sst.aws.Bucket"
    }
    "WebAppService-eu-west-1": {
      "service": string
      "type": "sst.aws.Service"
      "url": string
    }
    "WebAppService-us-east-1": {
      "service": string
      "type": "sst.aws.Service"
      "url": string
    }
    "WebAppUrl": {
      "type": "asb.asb.Constant"
      "value": string
    }
    "WebhooksApi": {
      "type": "sst.aws.Router"
      "url": string
    }
    "WebhooksApiFunction": {
      "name": string
      "type": "sst.aws.Function"
      "url": string
    }
  }
}
