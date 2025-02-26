import path from 'node:path';
import { analyticsApi } from './analytics';
import {
  CLOUDFLARE_ZONE_ID,
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
import type { FlyRegion } from './types/fly.io';
import { isProd } from './utils/constants';
import { buildLinks, linksToEnv } from './utils/link';

type RegionConfig = {
  region: FlyRegion;
  replicas: number;
};

const regions: RegionConfig[] = isProd
  ? [
      { region: 'iad', replicas: 4 },
      { region: 'fra', replicas: 4 },
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
  const flyApp = new fly.App('WebApp', {
    name: `${$app.name}-${$app.stage}-www`,
    org: process.env.FLY_ORG,
    assignSharedIpAddress: true,
  });
  const webAppImage = buildWebAppImage();

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
          cpus: isProd ? 4 : 1,
          memory: isProd ? 1024 : 512,
        }),
      );
    }
    return { region, machines };
  });
  buildFlyAutoscaler();

  new cloudflare.Record('WebAppDnsRecord', {
    name: DOMAIN.value,
    type: 'CNAME',
    proxied: true,
    zoneId: CLOUDFLARE_ZONE_ID.zoneId,
    content: `${flyApp.name}.fly.dev`,
  });

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
        ...linksToEnv(links),
        ...env,
        AWS_ACCESS_KEY_ID: flyAwsAccessKeyId,
        AWS_SECRET_ACCESS_KEY: flyAwsAccessKeySecret,
        AWS_REGION: ($app.providers?.aws.region ?? 'us-east-1') as string,
        PRIMARY_REGION: regions[0].region,
      }));
  }

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
        FAS_STARTED_MACHINE_COUNT: `max(min(ceil(connects / 200), ${regions.reduce((acc, { replicas }) => acc + replicas, 0)}), ${regions.length})`, // 200 connections per machine, max all replicas per region, min 1 machine per region
        FAS_PROMETHEUS_ADDRESS: `https://api.fly.io/prometheus/${process.env.FLY_ORG!}`,
        FAS_PROMETHEUS_TOKEN: flyApiToken,
        FAS_PROMETHEUS_METRIC_NAME: 'connects',
        FAS_PROMETHEUS_QUERY:
          'sum(increase(fly_app_tcp_connects_count{app="$APP_NAME"}[1m])) or vector(0)',
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
}
