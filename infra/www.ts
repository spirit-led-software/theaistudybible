import fs from 'node:fs';
import {
  DeleteObjectCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import mime from 'mime';
import { minimatch } from 'minimatch';
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
import { donationLink } from './stripe';
import { isProd } from './utils/constants';
const defaultCacheControlHeaders =
  'public,max-age=0,s-maxage=86400,stale-while-revalidate=86400,immutable';
const staticCacheControlHeaders = 'public,max-age=31536000,s-maxage=31536000,immutable';
const doNotCacheHeaders = 'public,max-age=0,s-maxage=0,must-revalidate';
const cachingMap = {
  '/_build/assets/**': staticCacheControlHeaders,
  '/_build/manifest.webmanifest': doNotCacheHeaders,
  '/_build/service-worker.js*': doNotCacheHeaders,
  '/_server/assets/**': defaultCacheControlHeaders,
  '/assets/**': staticCacheControlHeaders,
  '/logos/**': defaultCacheControlHeaders,
  '/pwa/**': defaultCacheControlHeaders,
  '/apple-touch-icon-180x180.png': defaultCacheControlHeaders,
  '/favicon.ico': defaultCacheControlHeaders,
  '/icon.png': defaultCacheControlHeaders,
  '/maskable-icon-512x512.png': defaultCacheControlHeaders,
  '/robots.txt': doNotCacheHeaders,
};

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
    webAppSentryProject.internalId,
    webAppSentryProject.name,
    SENTRY_AUTH_TOKEN.value,
    donationLink.value,
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
      donationLink,
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
      SENTRY_AUTH_TOKEN: sentryAuthToken,
      PUBLIC_DONATION_LINK: donationLink,
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
  const build = buildWebApp();
  const bucket = new sst.aws.Bucket(
    'WebAppAssetsBucket',
    { access: 'cloudfront' },
    { retainOnDelete: false },
  );
  const assets = uploadAssets();

  const serverDomain = $interpolate`server.${DOMAIN.value}`;
  const regionalResources = regions.map((region) => {
    const provider = new aws.Provider(`WebAppProvider-${region}`, { region });
    const serverFn = new sst.aws.Function(
      `WebAppServerFn-${region}`,
      {
        bundle: `${$cli.paths.root}/apps/www/.output/server`,
        handler: 'index.handler',
        runtime: 'nodejs22.x',
        memory: '1024 MB',
        url: true,
        streaming: true,
      },
      { provider, dependsOn: [build] },
    );
    const serverFnRouter = new sst.aws.Router(
      `WebAppServerFnRouter-${region}`,
      {
        routes: { '/*': serverFn.url },
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
        transform: { cdn: { wait: !$dev } },
      },
      { provider },
    );
    return { provider, serverFn, serverFnRouter };
  });

  const cdn = buildCdn();
  removeOldAssets();

  function buildWebApp() {
    const buildCmd = new command.local.Command('BuildWebApp', {
      create: 'bun run build',
      update: 'bun run build',
      dir: `${$cli.paths.root}/apps/www`,
      environment: baseEnv,
      triggers: [Date.now()],
    });

    return buildCmd;
  }

  function uploadAssets() {
    return $util.all([bucket.name, build.urn]).apply(async ([bucketName]) => {
      const searchPath = `${$cli.paths.root}/apps/www/.output/public/`;
      const assets = fs.readdirSync(searchPath, { recursive: true, withFileTypes: true });
      if (assets.length === 0) {
        throw new Error('No assets found in build');
      }

      const uploadedAssets: string[] = [];
      const bucket = new S3Client();
      for (const asset of assets) {
        if (asset.isFile()) {
          const path = `${asset.parentPath}/${asset.name}`;
          const key = path.replace(searchPath, '');
          await bucket.send(
            new PutObjectCommand({
              Bucket: bucketName,
              Key: key,
              Body: fs.readFileSync(path),
              CacheControl:
                Object.entries(cachingMap).find(([pattern]) => minimatch(key, pattern))?.[1] ??
                defaultCacheControlHeaders,
              ContentType: mime.getType(key) ?? undefined,
            }),
          );
          uploadedAssets.push(key);
        }
      }
      return uploadedAssets;
    });
  }

  function getStaticAssetPaths() {
    return assets.apply((assets) => {
      // Get unique top-level paths (files and directories)
      return Array.from(
        new Set(
          assets.map((asset) => {
            if (asset.includes('/')) {
              return asset.substring(0, asset.indexOf('/') + 1);
            }
            return asset;
          }),
        ),
      );
    });
  }

  function buildCdn() {
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
      compress: false, // compression is handled by the origin
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

    const s3Origin: aws.types.input.cloudfront.DistributionOrigin = {
      originId: 's3Origin',
      domainName: bucket.nodes.bucket.bucketRegionalDomainName,
      originAccessControlId: new aws.cloudfront.OriginAccessControl(
        'WebAppBucketOriginAccessControl',
        {
          originAccessControlOriginType: 's3',
          signingBehavior: 'always',
          signingProtocol: 'sigv4',
        },
      ).id,
    };
    const s3OriginBehavior: Omit<
      aws.types.input.cloudfront.DistributionOrderedCacheBehavior,
      'pathPattern'
    > = {
      targetOriginId: s3Origin.originId,
      viewerProtocolPolicy: 'redirect-to-https',
      allowedMethods: ['GET', 'HEAD', 'OPTIONS'],
      cachedMethods: ['GET', 'HEAD'],
      compress: true,
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
        orderedCacheBehaviors: getStaticAssetPaths().apply((assets) => [
          {
            pathPattern: '/_server',
            ...serverOriginBehavior,
          },
          ...assets.map((asset) => ({
            pathPattern: asset.endsWith('/') ? `/${asset}*` : `/${asset}`,
            ...s3OriginBehavior,
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
      { dependsOn: [...regionalResources.flatMap((r) => Object.values(r))] },
    );
  }

  function removeOldAssets() {
    return $util.all([bucket.name, assets, cdn.urn]).apply(async ([bucketName, assets]) => {
      const bucket = new S3Client();
      let isTruncated = true;
      let continuationToken: string | undefined;
      while (isTruncated) {
        const result = await bucket.send(
          new ListObjectsV2Command({ Bucket: bucketName, ContinuationToken: continuationToken }),
        );
        for (const asset of result.Contents ?? []) {
          if (asset.Key && !assets.includes(asset.Key)) {
            await bucket.send(new DeleteObjectCommand({ Bucket: bucketName, Key: asset.Key }));
          }
        }
        isTruncated = result.IsTruncated ?? false;
        continuationToken = result.NextContinuationToken;
      }
    });
  }
}
