import fs from 'node:fs';
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
import { isProd } from './utils/constants';
import { buildLinks, linksToEnv } from './utils/link';

const regions: {
  googleRegion: string;
  awsRegion: aws.Region;
}[] = isProd
  ? [
      { googleRegion: 'us-east4', awsRegion: 'us-east-1' },
      { googleRegion: 'europe-west1', awsRegion: 'eu-west-1' },
    ]
  : [{ googleRegion: 'us-east4', awsRegion: 'us-east-1' }];

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
  const webAppImage = buildWebAppImage();
  const env = buildEnv();
  const serverDomain = $interpolate`server.${DOMAIN.value}`;
  const regionalResources = regions.map(({ googleRegion, awsRegion }) => {
    const service = new gcp.cloudrunv2.Service(`WebAppService-${googleRegion}`, {
      name: `tasb-${$app.stage}-www-${googleRegion}`,
      location: googleRegion,
      template: {
        containers: [
          {
            image: webAppImage.ref,
            envs: env.apply((env) =>
              Object.entries(env).map(([key, value]) => ({ name: key, value })),
            ),
            ports: { containerPort: 8080 },
            resources: {
              cpuIdle: true,
              limits: { cpu: '2', memory: '2Gi' },
              startupCpuBoost: true,
            },
          },
        ],
        scaling: { minInstanceCount: 0, maxInstanceCount: 100 },
        maxInstanceRequestConcurrency: 200,
      },
      deletionProtection: isProd,
    });

    new gcp.cloudrun.IamBinding(`WebAppServiceIamBinding-${googleRegion}`, {
      service: service.name,
      role: 'roles/run.invoker',
      members: ['allUsers'],
    });

    const serviceRouter = new sst.aws.Router(`WebAppServiceRouter-${awsRegion}`, {
      routes: { '/*': service.urls[0] },
      domain: {
        name: serverDomain,
        dns: sst.aws.dns({
          override: true,
          transform: {
            record: (args) => {
              args.setIdentifier = awsRegion;
              args.latencyRoutingPolicies = [{ region: awsRegion }];
            },
          },
        }),
      },
    });
    return { service, serviceRouter };
  });

  buildCdn();

  function buildWebAppImage() {
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

    const registryHost = 'us-east4-docker.pkg.dev';

    return new dockerbuild.Image('WebAppImage', {
      tags: [
        $interpolate`${registryHost}/${gcp.config.project}/theaistudybible-www:${$app.stage}-${Date.now()}`,
        $interpolate`${registryHost}/${gcp.config.project}/theaistudybible-www:${$app.stage}-latest`,
      ],
      registries: [
        {
          address: `https://${registryHost}`,
          username: '_json_key',
          password: $util.secret(
            fs.readFileSync(
              path.resolve($cli.paths.root, process.env.GOOGLE_APPLICATION_CREDENTIALS!),
              'utf8',
            ),
          ),
        },
      ],
      dockerfile: { location: path.join($cli.paths.root, 'docker/www.Dockerfile') },
      context: { location: $cli.paths.root },
      buildArgs,
      platforms: ['linux/amd64'],
      push: true,
      cacheFrom: [{ local: { src: '/tmp/.buildx-cache' } }],
      cacheTo: [{ local: { dest: '/tmp/.buildx-cache-new', mode: 'max' } }],
    });
  }

  function buildIamUser() {
    const webAppIamPolicy = new aws.iam.Policy('WebAppIamPolicy', {
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
    const webAppIamUser = new aws.iam.User('WebAppIamUser');
    new aws.iam.UserPolicyAttachment('WebAppUserPolicyAttachment', {
      user: webAppIamUser.name,
      policyArn: webAppIamPolicy.arn,
    });
    const webAppAwsAccessKey = new aws.iam.AccessKey('WebAppAccessKey', {
      user: webAppIamUser.name,
    });
    return { webAppIamUser, webAppAwsAccessKey };
  }

  function buildEnv() {
    const { webAppAwsAccessKey } = buildIamUser();
    const links = allLinks.apply((links) => buildLinks(links));
    return $util
      .all([links, baseEnv, webAppAwsAccessKey.id, $util.secret(webAppAwsAccessKey.secret)])
      .apply(([links, env, webAppAwsAccessKeyId, webAppAwsAccessKeySecret]) => ({
        ...linksToEnv(links),
        ...env,
        AWS_ACCESS_KEY_ID: webAppAwsAccessKeyId,
        AWS_SECRET_ACCESS_KEY: webAppAwsAccessKeySecret,
        AWS_REGION: (aws.config.region ?? 'us-east-1') satisfies aws.Region,
      }));
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
        dependsOn: [
          ...regionalResources.flatMap(({ service, serviceRouter }) => [service, serviceRouter]),
        ],
      },
    );
  }
}
