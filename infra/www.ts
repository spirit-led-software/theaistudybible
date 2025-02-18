import path from 'node:path';
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
import { donationLink } from './stripe';
import type { KoyebRegion } from './types/koyeb';
import { isProd } from './utils/constants';
import { buildLinks, linksToEnv } from './utils/link';

const regions: KoyebRegion[] = isProd ? ['aws-us-east-1', 'FRA'] : ['aws-us-east-1'];

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
  const { image, registry } = buildWebAppImage();
  const app = new koyeb.KoyebApp('WebApp', {
    name: `${$app.name}-${$app.stage}-www`,
  });
  const registrySecret = new koyeb.KoyebSecret('WebAppRegistrySecret', {
    name: `${$app.name}-${$app.stage}-www-registry`,
    privateRegistry: aws.ecr
      .getAuthorizationTokenOutput({ registryId: registry.registryId })
      .apply(({ proxyEndpoint, userName, password }) => ({
        url: proxyEndpoint,
        username: userName,
        password,
      })),
  });

  const env = buildEnv();
  const service = new koyeb.KoyebService('WebAppService', {
    appName: app.name,
    definition: {
      name: `${$app.name}-${$app.stage}-www`,
      instanceTypes: { type: 'small' },
      regions: regions,
      docker: { image: image.ref, imageRegistySecret: registrySecret.name },
      envs: env.apply((env) => Object.entries(env).map(([key, value]) => ({ key, value }))),
      ports: [{ port: 8080, protocol: 'http' }],
      scalings: { min: 0, max: isProd ? 4 : 1 },
    },
  });

  buildCdn();

  function buildIamUser() {
    const iamPolicy = new aws.iam.Policy('WebAppIamPolicy', {
      policy: {
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Action: ['s3:*'],
            Resource: Object.values(storage)
              .filter((b) => b instanceof sst.aws.Bucket)
              .flatMap((b) => [b.arn, $interpolate`${b.arn}/*`]),
          },
          {
            Effect: 'Allow',
            Action: ['sqs:*'],
            Resource: Object.values(queues).map((q) => q.arn),
          },
        ],
      },
    });
    const iamUser = new aws.iam.User('WebAppIamUser');
    new aws.iam.UserPolicyAttachment('WebAppUserPolicyAttachment', {
      user: iamUser.name,
      policyArn: iamPolicy.arn,
    });
    const awsAccessKey = new aws.iam.AccessKey('WebAppAccessKey', {
      user: iamUser.name,
    });
    return { iamUser, awsAccessKey };
  }

  function buildEnv() {
    const { awsAccessKey } = buildIamUser();
    const links = allLinks.apply((links) => buildLinks(links));
    return $util
      .all([links, baseEnv, awsAccessKey.id, $util.secret(awsAccessKey.secret)])
      .apply(([links, env, awsAccessKeyId, awsAccessKeySecret]) => ({
        ...linksToEnv(links),
        ...env,
        AWS_ACCESS_KEY_ID: awsAccessKeyId,
        AWS_SECRET_ACCESS_KEY: awsAccessKeySecret,
        AWS_REGION: ($app.providers?.aws.region ?? 'us-east-1') as string,
      }));
  }

  function buildWebAppImage() {
    const registry = new aws.ecr.Repository('WebAppRegistry', {
      name: `${$app.name}-${$app.stage}-www`,
      forceDelete: true,
    });
    const buildArgs = $util
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
        $util.secret(SENTRY_AUTH_TOKEN.value),
        donationLink.value,
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
          donationLink,
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
          donation_link: donationLink,
        }),
      );

    const image = new dockerbuild.Image('WebAppImage', {
      tags: [
        $interpolate`${registry.repositoryUrl}:${Date.now()}`,
        $interpolate`${registry.repositoryUrl}:latest`,
      ],
      registries: [
        aws.ecr
          .getAuthorizationTokenOutput({
            registryId: registry.registryId,
          })
          .apply(({ proxyEndpoint, userName, password }) => ({
            address: proxyEndpoint,
            username: userName,
            password,
          })),
      ],
      dockerfile: { location: path.join($cli.paths.root, 'docker/www.Dockerfile') },
      context: { location: $cli.paths.root },
      buildArgs,
      platforms: ['linux/amd64'],
      push: true,
      cacheFrom: [{ local: { src: '/tmp/.buildx-cache' } }],
      cacheTo: [{ local: { dest: '/tmp/.buildx-cache-new', mode: 'max' } }],
    });

    return { registry, image };
  }

  function buildCdn() {
    const serverOrigin: aws.types.input.cloudfront.DistributionOrigin = {
      originId: 'serverOrigin',
      domainName: $interpolate`${service.appName}-${service.organizationId}.koyeb.app`,
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
        origins: [serverOrigin],
        defaultCacheBehavior: serverOriginBehavior,
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
        dependsOn: [service],
      },
    );
  }
}
