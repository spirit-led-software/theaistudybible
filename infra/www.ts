import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import {
  DeleteObjectsCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import mime from 'mime-types';
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
  const build = buildWebApp();
  const bucket = new sst.aws.Bucket(
    'WebAppAssetsBucket',
    { access: 'cloudfront' },
    { retainOnDelete: false },
  );
  const uploadedAssets = uploadStaticAssets();

  const serverDomain = $interpolate`server.${DOMAIN.value}`;
  const regionalResources = regions.map((region) => {
    const provider = new aws.Provider(`AwsProvider-${region}`, { region });
    const serverFn = new sst.aws.Function(
      `WebAppServerFn-${region}`,
      {
        bundle: 'apps/www/.output/server',
        handler: 'index.handler',
        runtime: 'nodejs22.x',
        architecture: process.arch === 'arm64' ? 'arm64' : 'x86_64', // need to make the same as the build system for bundled node_modules to be compatible
        memory: '1 GB',
        url: true,
        streaming: true,
        // @ts-expect-error
        environment: $output(baseEnv).apply((env) => ({
          ...env,
          NODE_OPTIONS: undefined,
        })),
        link: allLinks,
      },
      { provider, dependsOn: [build] },
    );
    const serverFnRouter = new sst.aws.Router(`WebAppServerRouter-${region}`, {
      routes: { '/*': serverFn.url },
      domain: {
        name: serverDomain,
        dns: sst.aws.dns({
          override: true,
          transform: {
            record: (args) => {
              args.setIdentifier = region;
              args.latencyRoutingPolicies = [{ region: region }];
            },
          },
        }),
      },
    });
    return { serverFn, serverFnRouter };
  });

  const cdn = buildCdn();
  removeOldAssets();

  function buildWebApp() {
    return new command.local.Command('WebAppBuild', {
      create: 'bun run build',
      update: 'bun run build',
      dir: join($cli.paths.root, 'apps/www'),
      environment: $util
        .all([baseEnv, SENTRY_AUTH_TOKEN.value])
        .apply(([env, sentryAuthToken]) => ({
          ...env,
          SENTRY_AUTH_TOKEN: sentryAuthToken,
        })),
      addPreviousOutputInEnv: false,
      triggers: [new Date().getTime()],
    });
  }

  const baseDir = 'apps/www/.output/public';
  function getStaticAssets(dir = baseDir) {
    const assets: string[] = [];
    for (const file of readdirSync(join($cli.paths.root, dir), {
      withFileTypes: true,
    })) {
      if (!file.isDirectory()) {
        assets.push(join(dir, file.name));
      } else {
        assets.push(...getStaticAssets(join(dir, file.name)));
      }
    }
    return assets;
  }

  function getStaticAssetPaths() {
    const assets: { path: string; type: 'file' | 'dir' }[] = [];
    for (const file of readdirSync(join($cli.paths.root, 'apps/www/.output/public'), {
      withFileTypes: true,
    })) {
      assets.push({ path: file.name, type: file.isDirectory() ? 'dir' : 'file' });
    }
    return assets;
  }

  function getMimeTypeAndCacheControl(path: string) {
    const mimeType = mime.lookup(path);
    if (!mimeType) {
      return {
        mimeType: 'application/octet-stream',
        cacheControl:
          'public,max-age=3600,s-maxage=31536000,stale-while-revalidate=86400,stale-if-error=259200',
      };
    }

    // Match the Dockerfile's immutable cache patterns based on mime types
    if (
      mimeType.startsWith('application/javascript') ||
      mimeType === 'text/javascript' ||
      mimeType === 'text/css' ||
      mimeType === 'font/woff2' ||
      mimeType === 'image/jpeg' ||
      mimeType === 'image/png' ||
      mimeType === 'image/svg+xml' ||
      mimeType === 'image/webp' ||
      mimeType === 'image/x-icon' ||
      mimeType === 'image/gif'
    ) {
      return { mimeType, cacheControl: 'public,max-age=31536000,immutable' };
    }

    // All other files get shorter cache with stale-while-revalidate strategy
    return {
      mimeType,
      cacheControl:
        'public,max-age=3600,s-maxage=31536000,stale-while-revalidate=86400,stale-if-error=259200',
    };
  }

  function uploadStaticAssets() {
    return $util.all([bucket.name, build.stdout]).apply(async ([bucketName]) => {
      const assets = getStaticAssets();
      const s3 = new S3Client({});

      const BATCH_SIZE = 10;
      const results: string[] = [];

      for (let i = 0; i < assets.length; i += BATCH_SIZE) {
        const batch = assets.slice(i, i + BATCH_SIZE);
        const uploadPromises = batch.map(async (asset) => {
          const key = asset.replace(`${baseDir}/`, '');
          const { mimeType, cacheControl } = getMimeTypeAndCacheControl(asset);
          const command = new PutObjectCommand({
            Bucket: bucketName,
            Key: key,
            Body: readFileSync(asset),
            ContentType: mimeType,
            CacheControl: cacheControl,
          });

          const result = await s3.send(command);
          if (result.$metadata.httpStatusCode !== 200) {
            throw new Error(`Failed to upload asset ${asset}`);
          }
          return asset;
        });

        const batchResults = await Promise.all(uploadPromises);
        results.push(...batchResults);
      }

      return getStaticAssetPaths();
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
      compress: false, // compression is handled by the server
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
          functionArn: new aws.cloudfront.Function('WebAppCdnServerFunction', {
            runtime: 'cloudfront-js-2.0',
            code: 'function handler(event) { event.request.headers["x-forwarded-host"] = event.request.headers.host; return event.request; }',
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
        orderedCacheBehaviors: uploadedAssets.apply((assets) => [
          {
            pathPattern: '_server/',
            ...serverOriginBehavior,
          },
          ...assets.map((asset) => ({
            pathPattern: asset.type === 'dir' ? `${asset.path}/*` : asset.path,
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
      { dependsOn: [...regionalResources.flatMap(({ serverFn }) => [serverFn])] },
    );
  }

  function removeOldAssets() {
    $util.all([bucket.name, build.stdout, cdn.urn]).apply(async ([bucketName]) => {
      const currentAssets = new Set(getStaticAssets());
      const s3 = new S3Client({});

      let continuationToken: string | undefined;
      while (continuationToken) {
        const command = new ListObjectsV2Command({
          Bucket: bucketName,
          ContinuationToken: continuationToken,
        });
        const response = await s3.send(command);

        // Delete objects that aren't in current assets
        const objectsToDelete = response.Contents?.filter(
          (obj) => obj.Key && !currentAssets.has(obj.Key),
        );

        if (objectsToDelete?.length) {
          await s3.send(
            new DeleteObjectsCommand({
              Bucket: bucketName,
              Delete: {
                Objects: objectsToDelete.map((obj) => ({ Key: obj.Key! })),
              },
            }),
          );
        }

        continuationToken = response.NextContinuationToken;
      }
    });
  }
}
