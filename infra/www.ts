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
import { SENTRY_AUTH_TOKEN } from './secrets';
import { cdn } from './storage';
import { isProd } from './utils/constants';

const regions: aws.Region[] = isProd ? ['us-east-1', 'eu-west-1'] : ['us-east-1'];

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
    webAppSentryProject.internalId.apply((id) => id.toString()),
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
    title: 'WebApp',
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

  const webAppImage = buildWebAppImage();

  const serverDomain = $interpolate`server.${DOMAIN.value}`;

  const regionalResources = regions.map((region) => {
    const provider = new aws.Provider(`AwsProvider-${region}`, { region });
    const vpc = new sst.aws.Vpc(`Vpc-${region}`, {}, { provider });
    const cluster = new sst.aws.Cluster(`Cluster-${region}`, { vpc }, { provider });
    const service = cluster.addService(`WebAppService-${region}`, {
      image: webAppImage.ref,
      loadBalancer: {
        ports: [
          { listen: '80/tcp', forward: '8080/tcp' },
          { listen: '443/tls', forward: '8080/tcp' },
        ],
        domain: {
          name: serverDomain,
          dns: sst.aws.dns({
            override: true,
            transform: {
              record: (args) => {
                args.setIdentifier = region;
                args.latencyRoutingPolicies = [{ region }];
              },
            },
          }),
        },
      },
      architecture: 'x86_64',
      cpu: '0.25 vCPU',
      memory: '0.5 GB',
      scaling: { cpuUtilization: 90, memoryUtilization: 90, min: 1, max: isProd ? 4 : 1 },
      health: {
        command: ['CMD-SHELL', 'curl -f http://localhost:8080/health || exit 1'],
        interval: '10 seconds',
        timeout: '10 seconds',
        startPeriod: '20 seconds',
        retries: 3,
      },
      environment: baseEnv,
      link: allLinks,
    });
    return { region, vpc, cluster, service };
  });

  buildCdn();

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

    const ecrRegistry = new aws.ecr.Repository('WebAppEcrRegistry', {
      name: `${$app.name}-${$app.stage}-www`,
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
        webAppSentryProject.internalId.apply((id) => id.toString()),
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
        $interpolate`${ecrRegistry.repositoryUrl}:${Date.now()}`,
        $interpolate`${ecrRegistry.repositoryUrl}:latest`,
      ],
      registries: [
        aws.ecr
          .getAuthorizationTokenOutput({ registryId: ecrRegistry.registryId })
          .apply((token) => ({
            address: token.proxyEndpoint,
            username: token.userName,
            password: token.password,
          })),
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
      domainName: serverDomain,
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
      // CloudFront's managed AllViewer policy
      originRequestPolicyId: '216adef6-5c7f-47e4-b989-5492eafa07d3',
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
      { dependsOn: [...regionalResources.flatMap(({ service }) => [service])] },
    );
  }
}
