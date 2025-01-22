/* This file is auto-generated by SST. Do not edit. */
/* tslint:disable */
/* eslint-disable */
/* deno-fmt-ignore-file */

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
    "AppleAuthKey": {
      "type": "sst.sst.Secret"
      "value": string
    }
    "AppleClientId": {
      "type": "sst.sst.Secret"
      "value": string
    }
    "AppleKeyId": {
      "type": "sst.sst.Secret"
      "value": string
    }
    "AppleTeamId": {
      "type": "sst.sst.Secret"
      "value": string
    }
    "BibleBucket": {
      "name": string
      "type": "sst.aws.Bucket"
    }
    "BrainTrustApiKey": {
      "type": "sst.sst.Secret"
      "value": string
    }
    "BrainTrustProjectName": {
      "type": "asb.asb.Constant"
      "value": string
    }
    "Cdn": {
      "type": "sst.aws.Router"
      "url": string
    }
    "ChapterMessageBucket": {
      "name": string
      "type": "sst.aws.Bucket"
    }
    "DataSourceFilesBucket": {
      "name": string
      "type": "sst.aws.Bucket"
    }
    "DataSourcesSyncQueue": {
      "type": "sst.aws.Queue"
      "url": string
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
    "DeepSeekApiKey": {
      "type": "sst.sst.Secret"
      "value": string
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
    "GoogleClientId": {
      "type": "sst.sst.Secret"
      "value": string
    }
    "GoogleClientSecret": {
      "type": "sst.sst.Secret"
      "value": string
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
    "IndexDataSourceFilesQueue": {
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
    "WebAppBucket-1737577336808": {
      "name": string
      "type": "sst.aws.Bucket"
    }
    "WebAppCdnLoggingBucket": {
      "name": string
      "type": "sst.aws.Bucket"
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
/// <reference path="sst-env.d.ts" />

import "sst"
export {}