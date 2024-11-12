import fs from 'node:fs';
import path from 'node:path';
import { sha256 } from '@noble/hashes/sha256';
import mime from 'mime';
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
  const buildCmd = new command.local.Command('Build', {
    dir: $cli.paths.root,
    create: 'bun run build',
    update: 'bun run build',
    environment: env,
    triggers: [Date.now()],
  });

  const bucket = new sst.aws.Bucket('WebAppBucket', { access: 'cloudfront' });
  uploadAssets();

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

  function getAllAssets(dir: string): string[] {
    const assets: string[] = [];
    const files = fs.readdirSync(dir, { withFileTypes: true });
    for (const file of files) {
      if (file.isDirectory()) {
        assets.push(...getAllAssets(path.join(dir, file.name)));
      } else {
        assets.push(path.join(dir, file.name));
      }
    }
    return assets;
  }

  function uploadAssets() {
    const ttl = 86400;
    return buildCmd.stdout.apply(() =>
      getAllAssets(path.resolve($cli.paths.root, 'apps', 'www', '.output', 'public'))
        .filter((asset) => !asset.endsWith('.map')) // Ignore source maps
        .map((asset) => {
          const key = asset.replace(
            path.resolve($cli.paths.root, 'apps', 'www', '.output', 'public'),
            '',
          );
          const sanitizedKey = key.replace(
            /[\\\/\.\-\+\(\)\[\]\{\}\!\@\#\$\%\^\&\*\=\;\:\'\"\,\<\>\?\`\~]/g,
            '_',
          );
          const fileContent = fs.readFileSync(asset);
          const hash = Buffer.from(sha256(new Uint8Array(fileContent))).toString('hex');
          return new aws.s3.BucketObjectv2(`WebAppAssets-${sanitizedKey}`, {
            bucket: bucket.name,
            key,
            source: new $util.asset.FileAsset(asset),
            contentType: mime.getType(asset) ?? 'application/octet-stream',
            sourceHash: hash,
            cacheControl: `public,max-age=${ttl},s-maxage=${ttl},stale-while-revalidate=${ttl}`,
          });
        }),
    );
  }

  function buildWebAppImage() {
    const webAppImageRepository = new aws.ecr.Repository('WebAppImageRepository', {
      name: `${$app.name}-${$app.stage}-www`,
      forceDelete: true,
    });

    const buildArgs = $util
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
    const staticAssets = buildCmd.stdout.apply(() => {
      return fs.readdirSync(path.resolve($cli.paths.root, 'apps', 'www', '.output', 'public'), {
        withFileTypes: true,
      });
    });

    return new sst.aws.Cdn('WebAppCdn', {
      origins: [
        {
          originId: 'server',
          domainName: serverDomain,
          customOriginConfig: {
            httpPort: 80,
            httpsPort: 443,
            originProtocolPolicy: 'match-viewer',
            originSslProtocols: ['TLSv1.2'],
          },
        },
        {
          originId: 's3',
          domainName: bucket.domain,
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
              pathPattern: asset.isDirectory() ? `${asset.name}/*` : asset.name,
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
