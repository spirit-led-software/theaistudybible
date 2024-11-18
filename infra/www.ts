import path from 'node:path';
import { ListObjectsV2Command, S3Client } from '@aws-sdk/client-s3';
import { analyticsApi } from './analytics';
import {
  DOMAIN,
  POSTHOG_API_KEY,
  POSTHOG_UI_HOST,
  STRIPE_PUBLISHABLE_KEY,
  WEBAPP_URL,
} from './constants';
import { allLinks } from './defaults';
import { webAppSentryKey, webAppSentryProject } from './monitoring';
import * as queues from './queues';
import { SENTRY_AUTH_TOKEN } from './secrets';
import { cdn } from './storage';
import * as storage from './storage';
import type { FlyRegion } from './types/fly.io';
import { isProd } from './utils/constants';
import { buildLinks } from './utils/link';

type RegionConfig = {
  region: FlyRegion;
  replicas: number;
};

const regions: RegionConfig[] = isProd
  ? [
      { region: 'iad', replicas: 4 },
      { region: 'fra', replicas: 4 },
      { region: 'sin', replicas: 4 },
    ]
  : [{ region: 'iad', replicas: 1 }];

const baseEnv = $util
  .all([
    WEBAPP_URL.value,
    cdn.url,
    STRIPE_PUBLISHABLE_KEY.value,
    POSTHOG_UI_HOST.value,
    analyticsApi.properties.url,
    POSTHOG_API_KEY.value,
    webAppSentryKey.dsnPublic,
    webAppSentryProject.organization,
    webAppSentryProject.projectId.apply((id) => id.toString()),
    webAppSentryProject.name,
    SENTRY_AUTH_TOKEN.value,
  ])
  .apply(
    ([
      webAppUrl,
      cdnUrl,
      stripePublishableKey,
      posthogUiHost,
      posthogApiHost,
      posthogApiKey,
      sentryDsnPublic,
      sentryOrg,
      sentryProjectId,
      sentryProjectName,
    ]) => ({
      PUBLIC_DEV: $dev.toString(),
      PUBLIC_STAGE: $app.stage,
      PUBLIC_WEBAPP_URL: webAppUrl,
      PUBLIC_CDN_URL: cdnUrl,
      PUBLIC_STRIPE_PUBLISHABLE_KEY: stripePublishableKey,
      PUBLIC_POSTHOG_UI_HOST: posthogUiHost,
      PUBLIC_POSTHOG_API_HOST: posthogApiHost,
      PUBLIC_POSTHOG_API_KEY: posthogApiKey,
      PUBLIC_SENTRY_DSN: sentryDsnPublic,
      PUBLIC_SENTRY_ORG: sentryOrg,
      PUBLIC_SENTRY_PROJECT_ID: sentryProjectId,
      PUBLIC_SENTRY_PROJECT_NAME: sentryProjectName,
    }),
  );

export const webAppDevCmd = new sst.x.DevCommand('WebAppDev', {
  dev: {
    directory: 'apps/www',
    command: 'bun run dev',
    autostart: true,
  },
  environment: baseEnv,
  link: allLinks,
});

if (!$dev) {
  const bucket = new sst.aws.Bucket(
    `WebAppBucket-${Date.now()}`,
    { access: 'cloudfront' },
    { retainOnDelete: false },
  );

  const flyApp = new fly.App('WebApp', {
    name: `${$app.name}-${$app.stage}-www`,
    org: process.env.FLY_ORG,
  });
  const webAppImage = buildWebAppImage();

  new fly.Ip('WebAppIpv4', {
    app: flyApp.name,
    type: 'v4',
  });
  new fly.Ip('WebAppIpv6', {
    app: flyApp.name,
    type: 'v6',
  });

  const env = buildEnv();
  const regionalResources = regions.map(({ region, replicas }) => {
    const machines: fly.Machine[] = [];
    for (let i = 0; i < replicas; i++) {
      machines.push(
        new fly.Machine(`WebAppMachine-${region}-${i}`, {
          app: flyApp.name,
          region,
          image: webAppImage.ref,
          env,
          services: [
            {
              ports: [
                { port: 80, handlers: ['http'] },
                { port: 443, handlers: ['tls', 'http'] },
              ],
              internalPort: 8080,
              protocol: 'tcp',
            },
          ],
          cpuType: 'shared',
          cpus: 1,
          memory: 1024,
        }),
      );
    }
    return { region, machines };
  });
  const { machine: flyAutoscalerMachine } = buildFlyAutoscaler();

  buildCdn();

  function buildFlyIamUser() {
    const flyIamPolicy = new aws.iam.Policy('FlyIamPolicy', {
      policy: {
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Action: ['s3:*'],
            Resource: Object.values(storage)
              .filter((b) => b instanceof sst.aws.Bucket)
              .flatMap((b) => [b.nodes.bucket.arn, $interpolate`${b.nodes.bucket.arn}/*`]),
          },
          {
            Effect: 'Allow',
            Action: ['sqs:*'],
            Resource: Object.values(queues).map((q) => q.arn),
          },
        ],
      },
    });
    const flyIamUser = new aws.iam.User('FlyIamUser');
    new aws.iam.UserPolicyAttachment('FlyUserPolicyAttachment', {
      user: flyIamUser.name,
      policyArn: flyIamPolicy.arn,
    });
    const flyAwsAccessKey = new aws.iam.AccessKey('FlyAccessKey', {
      user: flyIamUser.name,
    });
    return { flyIamUser, flyAwsAccessKey };
  }

  function buildEnv() {
    const { flyAwsAccessKey } = buildFlyIamUser();
    const links = allLinks.apply((links) => buildLinks(links));
    return $util
      .all([links, baseEnv, flyAwsAccessKey.id, $util.secret(flyAwsAccessKey.secret)])
      .apply(([links, env, flyAwsAccessKeyId, flyAwsAccessKeySecret]) => ({
        ...links.reduce(
          (acc, l) => {
            acc[`SST_RESOURCE_${l.name}`] = JSON.stringify(l.properties);
            return acc;
          },
          {} as Record<string, string>,
        ),
        SST_RESOURCE_App: JSON.stringify({ name: $app.name, stage: $app.stage }),
        ...env,
        AWS_ACCESS_KEY_ID: flyAwsAccessKeyId,
        AWS_SECRET_ACCESS_KEY: flyAwsAccessKeySecret,
        AWS_REGION: ($app.providers?.aws.region ?? 'us-east-1') as string,
        PRIMARY_REGION: regions[0].region,
      }));
  }

  function buildWebAppImage() {
    const buildIamUser = new aws.iam.User('BuildIamUser');
    const buildIamPolicy = new aws.iam.Policy('BuildIamPolicy', {
      policy: {
        Statement: [
          {
            Effect: 'Allow',
            Action: ['s3:*'],
            Resource: [bucket.arn, $interpolate`${bucket.arn}/*`],
          },
        ],
        Version: '2012-10-17',
      },
    });
    new aws.iam.UserPolicyAttachment('BuildIamUserPolicyAttachment', {
      user: buildIamUser.name,
      policyArn: buildIamPolicy.arn,
    });
    const accessKey = new aws.iam.AccessKey('BuildIamAccessKey', {
      user: buildIamUser.name,
    });

    const buildArgs = $util
      .all([
        accessKey.id,
        $util.secret(accessKey.secret),
        bucket.nodes.bucket.region,
        bucket.name,
        WEBAPP_URL.value,
        cdn.url,
        STRIPE_PUBLISHABLE_KEY.value,
        POSTHOG_UI_HOST.value,
        analyticsApi.properties.url,
        POSTHOG_API_KEY.value,
        webAppSentryKey.dsnPublic,
        webAppSentryProject.organization,
        webAppSentryProject.projectId.apply((id) => id.toString()),
        webAppSentryProject.name,
        $util.secret(SENTRY_AUTH_TOKEN.value),
      ])
      .apply(
        ([
          awsAccessKeyId,
          awsSecretAccessKey,
          awsRegion,
          assetsBucket,
          webappUrl,
          cdnUrl,
          stripePublishableKey,
          posthogUiHost,
          posthogApiHost,
          posthogApiKey,
          sentryDsn,
          sentryOrg,
          sentryProjectId,
          sentryProjectName,
          sentryAuthToken,
        ]) => ({
          aws_access_key_id: awsAccessKeyId,
          aws_secret_access_key: awsSecretAccessKey,
          aws_default_region: awsRegion,
          assets_bucket: assetsBucket,
          stage: $app.stage,
          webapp_url: webappUrl,
          cdn_url: cdnUrl,
          stripe_publishable_key: stripePublishableKey,
          posthog_ui_host: posthogUiHost,
          posthog_api_host: posthogApiHost,
          posthog_api_key: posthogApiKey,
          sentry_dsn: sentryDsn,
          sentry_org: sentryOrg,
          sentry_project_id: sentryProjectId,
          sentry_project_name: sentryProjectName,
          sentry_auth_token: sentryAuthToken,
        }),
      );

    return new dockerbuild.Image('WebAppImage', {
      tags: [
        $interpolate`registry.fly.io/${flyApp.name}:${Date.now()}`,
        $interpolate`registry.fly.io/${flyApp.name}:latest`,
      ],
      registries: [
        {
          address: 'registry.fly.io',
          username: 'x',
          password: $util.secret(process.env.FLY_API_TOKEN!),
        },
      ],
      dockerfile: { location: path.join($cli.paths.root, 'docker/www.Dockerfile') },
      context: { location: $cli.paths.root },
      buildArgs,
      platforms: ['linux/amd64'],
      push: true,
      network: 'host',
      cacheFrom: [{ local: { src: '/tmp/.buildx-cache' } }],
      cacheTo: [{ local: { dest: '/tmp/.buildx-cache-new', mode: 'max' } }],
    });
  }

  function buildFlyAutoscaler() {
    const app = new fly.App('FlyAutoscalerApp', {
      name: `${$app.name}-${$app.stage}-www-autoscaler`,
    });
    const env = $util
      .all([$util.secret(process.env.FLY_API_TOKEN!), flyApp.name])
      .apply(([flyApiToken, appName]) => ({
        FAS_ORG: process.env.FLY_ORG!,
        FAS_APP_NAME: appName,
        FAS_API_TOKEN: flyApiToken,
        FAS_REGIONS: regions.map(({ region }) => region).join(','),
        FAS_STARTED_MACHINE_COUNT: `max(min(ceil(connects / 500), ${regions.reduce((acc, { replicas }) => acc + replicas, 0)}), ${regions.length})`, // 500 connections per machine, max all replicas per region, min 1 machine per region
        FAS_PROMETHEUS_ADDRESS: `https://api.fly.io/prometheus/${process.env.FLY_ORG!}`,
        FAS_PROMETHEUS_TOKEN: flyApiToken,
        FAS_PROMETHEUS_METRIC_NAME: 'connects',
        FAS_PROMETHEUS_QUERY: 'fly_app_tcp_connects_count{app="$APP_NAME"} or vector(0)',
      }));
    const machine = new fly.Machine(
      'FlyAutoscalerMachine',
      {
        app: app.name,
        region: 'iad',
        image: 'flyio/fly-autoscaler:latest',
        env,
        cpuType: 'shared',
        cpus: 1,
        memory: 256,
      },
      { dependsOn: regionalResources.flatMap(({ machines }) => machines) },
    );
    return { app, machine };
  }

  function getStaticAssets() {
    return $util
      .all([bucket.name, bucket.nodes.bucket.region, webAppImage.ref])
      .apply(async ([bucketName, bucketRegion]) => {
        const assets: string[] = [];
        const client = new S3Client({ region: bucketRegion });

        let isTruncated = true;
        let continuationToken: string | undefined;

        // Handle pagination
        while (isTruncated) {
          const response = await client.send(
            new ListObjectsV2Command({
              Bucket: bucketName,
              Delimiter: '/',
              ContinuationToken: continuationToken,
            }),
          );
          // Process directories (CommonPrefixes)
          for (const prefix of response.CommonPrefixes ?? []) {
            if (prefix.Prefix) {
              assets.push(prefix.Prefix);
            }
          }
          // Process files
          for (const obj of response.Contents ?? []) {
            if (obj.Key && !obj.Key.includes('/')) {
              assets.push(obj.Key);
            }
          }
          isTruncated = response.IsTruncated ?? false;
          continuationToken = response.NextContinuationToken;
        }
        return assets;
      });
  }

  function buildCdn() {
    const bucketAccess = new aws.cloudfront.OriginAccessControl('WebAppBucketAccess', {
      originAccessControlOriginType: 's3',
      signingBehavior: 'always',
      signingProtocol: 'sigv4',
    });
    const s3Origin: aws.types.input.cloudfront.DistributionOrigin = {
      originId: 's3Origin',
      domainName: bucket.nodes.bucket.bucketRegionalDomainName,
      originAccessControlId: bucketAccess.id,
    };

    const serverOrigin: aws.types.input.cloudfront.DistributionOrigin = {
      originId: 'serverOrigin',
      domainName: $interpolate`${flyApp.name}.fly.dev`,
      customOriginConfig: {
        httpPort: 80,
        httpsPort: 443,
        originProtocolPolicy: 'https-only',
        originSslProtocols: ['TLSv1.2'],
        originReadTimeout: 60,
        originKeepaliveTimeout: 60,
      },
    };

    const serverOriginBehavior: Omit<
      aws.types.input.cloudfront.DistributionOrderedCacheBehavior,
      'pathPattern'
    > = {
      targetOriginId: serverOrigin.originId,
      viewerProtocolPolicy: 'redirect-to-https',
      allowedMethods: ['DELETE', 'GET', 'HEAD', 'OPTIONS', 'PATCH', 'POST', 'PUT'],
      cachedMethods: ['GET', 'HEAD'],
      compress: true,
      // https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/using-managed-origin-request-policies.html
      // CloudFront's managed AllViewerExceptHostHeader policy
      originRequestPolicyId: 'b689b0a8-53d0-40ab-baf2-68738e2966ac',
      cachePolicyId: new aws.cloudfront.CachePolicy('WebAppCdnServerCachePolicy', {
        maxTtl: 60 * 60 * 24 * 365, // 1 year
        minTtl: 0,
        defaultTtl: 0,
        parametersInCacheKeyAndForwardedToOrigin: {
          cookiesConfig: { cookieBehavior: 'none' },
          headersConfig: { headerBehavior: 'none' },
          queryStringsConfig: { queryStringBehavior: 'all' },
          enableAcceptEncodingBrotli: true,
          enableAcceptEncodingGzip: true,
        },
      }).id,
      functionAssociations: [
        {
          eventType: 'viewer-request',
          functionArn: new aws.cloudfront.Function('WebAppServerOriginCdnFn', {
            runtime: 'cloudfront-js-2.0',
            code: 'async function handler(event) { event.request.headers["x-forwarded-host"] = event.request.headers.host; return event.request; }',
          }).arn,
        },
      ],
    };
    const assetsCacheBehavior: Omit<
      aws.types.input.cloudfront.DistributionOrderedCacheBehavior,
      'pathPattern'
    > = {
      targetOriginId: s3Origin.originId,
      viewerProtocolPolicy: 'redirect-to-https',
      allowedMethods: ['GET', 'HEAD', 'OPTIONS'],
      cachedMethods: ['GET', 'HEAD'],
      compress: true,
      // https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/using-managed-cache-policies.html
      // CloudFront's managed CachingOptimized policy
      cachePolicyId: '658327ea-f89d-4fab-a63d-7e88639e58f6',
    };

    const loggingBucket = new sst.aws.Bucket(
      'WebAppCdnLoggingBucket',
      {},
      { retainOnDelete: isProd },
    );
    new aws.s3.BucketOwnershipControls('WebAppCdnLoggingBucketOwnershipControls', {
      bucket: loggingBucket.name,
      rule: { objectOwnership: 'BucketOwnerPreferred' },
    });

    return new sst.aws.Cdn(
      'WebAppCdn',
      {
        origins: [serverOrigin, s3Origin],
        defaultCacheBehavior: serverOriginBehavior,
        orderedCacheBehaviors: getStaticAssets().apply((assets) => [
          {
            pathPattern: '_server/',
            ...serverOriginBehavior,
          },
          ...assets.map((asset) => ({
            pathPattern: asset.endsWith('/') ? `${asset}*` : asset,
            ...assetsCacheBehavior,
          })),
        ]),
        wait: !$dev,
        invalidation: { paths: ['/*'], wait: !$dev },
        domain: {
          name: DOMAIN.value,
          redirects: DOMAIN.value.apply((domain) => [`www.${domain}`]),
          dns: sst.aws.dns({ override: true }),
        },
        transform: {
          distribution: (args) => {
            args.loggingConfig = { bucket: loggingBucket.domain };
          },
        },
      },
      {
        dependsOn: [...regionalResources.flatMap(({ machines }) => machines), flyAutoscalerMachine],
      },
    );
  }
}
