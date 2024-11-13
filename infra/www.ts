import path from 'node:path';
import { ListObjectsV2Command, S3Client } from '@aws-sdk/client-s3';
import { ANALYTICS_URL } from './analytics';
import { cdn } from './cdn';
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

const regions = ['us-east-1', 'ap-southeast-1'] as const;

const env = $util
  .all([
    WEBAPP_URL.value,
    cdn.url,
    STRIPE_PUBLISHABLE_KEY.value,
    POSTHOG_UI_HOST.value,
    ANALYTICS_URL.value,
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
      sentryAuthToken,
    ]) => ({
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
      SENTRY_AUTH_TOKEN: sentryAuthToken,
    }),
  );

export let webAppCdn: sst.aws.Cdn | undefined;
if (!$dev) {
  const bucket = new sst.aws.Bucket('WebAppBucket', { access: 'cloudfront' });

  const webAppImage = buildWebAppImage();

  const serverDomain = $interpolate`server.${DOMAIN.value}`;
  for (const region of regions) {
    const provider = new aws.Provider(`AwsProvider-${region}`, { region });

    const vpc = new sst.aws.Vpc(`WebAppVpc-${region}`, {}, { provider });
    const cluster = new sst.aws.Cluster(`WebAppCluster-${region}`, { vpc }, { provider });
    cluster.addService(`WebAppService-${region}`, {
      image: webAppImage.ref,
      link: allLinks,
      environment: env,
      loadBalancer: {
        ports: [
          { listen: '80/http', forward: '8080/http' },
          { listen: '443/https', forward: '8080/http' },
        ],
        domain: {
          name: serverDomain,
          dns: sst.aws.dns({
            transform: {
              record: (args) => {
                args.setIdentifier = region;
                args.latencyRoutingPolicies = [{ region }];
              },
            },
          }),
        },
      },
      scaling: { min: 1, max: 2, cpuUtilization: 90, memoryUtilization: 90 },
      cpu: '0.25 vCPU',
      memory: '0.5 GB',
      dev: {
        directory: path.resolve($cli.paths.root, 'apps', 'www'),
        command: 'bun run dev',
        url: $interpolate`https://${DOMAIN.value}`,
        autostart: true,
      },
    });
  }

  webAppCdn = buildCdn();

  function buildWebAppImage() {
    const awsProvider = $app.providers!.aws as aws.Provider;
    const webAppImageRepository = new aws.ecr.Repository('WebAppImageRepository', {
      name: `${$app.name}-${$app.stage}-www`,
      forceDelete: true,
    });

    const buildArgs = $util
      .all([
        awsProvider.accessKey.apply((key) => $util.secret(key ?? process.env.AWS_ACCESS_KEY_ID!)),
        awsProvider.secretKey.apply((key) =>
          $util.secret(key ?? process.env.AWS_SECRET_ACCESS_KEY!),
        ),
        bucket.nodes.bucket.region,
        bucket.name,
        WEBAPP_URL.value,
        cdn.url,
        STRIPE_PUBLISHABLE_KEY.value,
        POSTHOG_UI_HOST.value,
        ANALYTICS_URL.value,
        POSTHOG_API_KEY.value,
        webAppSentryKey.dsnPublic,
        webAppSentryProject.organization,
        webAppSentryProject.projectId.apply((id) => id.toString()),
        webAppSentryProject.name,
        SENTRY_AUTH_TOKEN.value,
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
          aws_region: awsRegion,
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
      tags: [$interpolate`${webAppImageRepository.repositoryUrl}:latest`],
      registries: [
        aws.ecr
          .getAuthorizationTokenOutput({
            registryId: webAppImageRepository.registryId,
          })
          .apply(({ proxyEndpoint, userName, password }) => ({
            address: proxyEndpoint,
            username: userName,
            password,
          })),
      ],
      dockerfile: { location: path.join(process.cwd(), 'docker/www.Dockerfile') },
      context: { location: process.cwd() },
      buildArgs,
      platforms: ['linux/amd64'],
      push: true,
      network: 'host',
      cacheFrom: [{ local: { src: '/tmp/.buildx-cache' } }],
      cacheTo: [{ local: { dest: '/tmp/.buildx-cache-new', mode: 'max' } }],
    });
  }

  function buildCdn() {
    const bucketAccess = new aws.cloudfront.OriginAccessControl('WebAppBucketAccess', {
      originAccessControlOriginType: 's3',
      signingBehavior: 'always',
      signingProtocol: 'sigv4',
    });
    const staticAssets = $util
      .all([bucket.name, bucket.nodes.bucket.region, webAppImage.ref])
      .apply(async ([bucketName, bucketRegion]) => {
        const s3 = new S3Client({ region: bucketRegion });
        const { Contents } = await s3.send(new ListObjectsV2Command({ Bucket: bucketName }));
        // Get top-level assets and directories
        return (
          Contents?.reduce<string[]>((acc, obj) => {
            const key = obj?.Key;
            if (!key) return acc;

            const isTopLevelFile = !key.includes('/');
            const isDirectory =
              key.endsWith('/') && !key.substring(0, key.length - 1).includes('/');
            if (isTopLevelFile || isDirectory) acc.push(key);

            return acc;
          }, []) ?? []
        );
      });
    return new sst.aws.Cdn('WebAppCdn', {
      origins: [
        {
          originId: 'server',
          domainName: serverDomain,
          customOriginConfig: {
            httpPort: 80,
            httpsPort: 443,
            originProtocolPolicy: 'https-only',
            originSslProtocols: ['TLSv1.2'],
          },
        },
        {
          originId: 's3',
          domainName: bucket.nodes.bucket.bucketRegionalDomainName,
          originAccessControlId: bucketAccess.id,
        },
      ],
      defaultCacheBehavior: {
        targetOriginId: 'server',
        viewerProtocolPolicy: 'redirect-to-https',
        allowedMethods: ['GET', 'HEAD', 'OPTIONS', 'POST', 'PUT', 'PATCH', 'DELETE'],
        cachedMethods: ['GET', 'HEAD'],
        compress: true,
        cachePolicyId: new aws.cloudfront.CachePolicy('WebAppCdnDefaultCachePolicy', {
          maxTtl: 60 * 60 * 24 * 365,
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
      },
      orderedCacheBehaviors: staticAssets.apply((assets) => [
        {
          pathPattern: '_server/',
          targetOriginId: 'server',
          viewerProtocolPolicy: 'redirect-to-https',
          allowedMethods: ['GET', 'HEAD', 'OPTIONS', 'POST', 'PUT', 'PATCH', 'DELETE'],
          cachedMethods: ['GET', 'HEAD'],
          compress: true,
          cachePolicyId: new aws.cloudfront.CachePolicy('WebAppCdnServerCachePolicy', {
            maxTtl: 60 * 60 * 24 * 365,
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
          // CloudFront's Managed-AllViewerExceptHostHeader policy
          originRequestPolicyId: 'b689b0a8-53d0-40ab-baf2-68738e2966ac',
        },
        ...assets.map(
          (asset) =>
            ({
              pathPattern: asset.endsWith('/') ? `${asset}*` : asset,
              targetOriginId: 's3',
              viewerProtocolPolicy: 'redirect-to-https',
              allowedMethods: ['GET', 'HEAD', 'OPTIONS'],
              cachedMethods: ['GET', 'HEAD'],
              compress: true,
              // CloudFront's managed CachingOptimized policy
              cachePolicyId: '658327ea-f89d-4fab-a63d-7e88639e58f6',
            }) satisfies aws.types.input.cloudfront.DistributionOrderedCacheBehavior,
        ),
      ]),
      invalidation: { paths: ['/*'], wait: true },
      domain: { name: DOMAIN.value, dns: sst.aws.dns() },
    });
  }
}
