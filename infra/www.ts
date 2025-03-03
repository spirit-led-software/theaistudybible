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
  ? [{ region: 'iad', replicas: 4 }]
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
    command: 'pnpm run dev',
    autostart: true,
  },
  environment: baseEnv,
  link: allLinks,
});

if (!$dev) {
  const flyApp = new fly.App('WebAppFlyApp', {
    name: `${$app.name}-${$app.stage}-webapp`,
    org: process.env.FLY_ORG,
    assignSharedIpAddress: true,
  });
  const ipv6 = new fly.Ip('WebAppFlyIpV6', {
    app: flyApp.name,
    type: 'v6',
  });
  const cert = new fly.Cert('WebAppFlyCert', {
    app: flyApp.name,
    hostname: DOMAIN.value,
  });
  new cloudflare.Record('WebAppCertValidationRecord', {
    name: cert.dnsValidationHostname,
    type: 'CNAME',
    proxied: false,
    ttl: 60,
    zoneId: CLOUDFLARE_ZONE_ID.zoneId,
    content: cert.dnsValidationTarget,
    allowOverwrite: true,
  });

  const webAppImage = buildWebAppImage();
  const env = buildEnv();
  const regionalResources = regions.map(({ region, replicas }) => {
    const machines: fly.Machine[] = [];
    for (let i = 0; i < replicas; i++) {
      machines.push(
        new fly.Machine(`WebAppFlyMachine-${region}-${i}`, {
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
          memory: 512,
        }),
      );
    }
    return { region, machines };
  });
  buildFlyAutoscaler();

  new cloudflare.Record(
    'WebAppDnsRecordIpv4',
    {
      name: DOMAIN.value,
      type: 'A',
      proxied: true,
      zoneId: CLOUDFLARE_ZONE_ID.zoneId,
      content: flyApp.sharedIpAddress,
      allowOverwrite: true,
    },
    { dependsOn: regionalResources.flatMap(({ machines }) => machines) },
  );
  new cloudflare.Record(
    'WebAppDnsRecordIpv6',
    {
      name: DOMAIN.value,
      type: 'AAAA',
      proxied: true,
      zoneId: CLOUDFLARE_ZONE_ID.zoneId,
      content: ipv6.address,
      allowOverwrite: true,
    },
    { dependsOn: regionalResources.flatMap(({ machines }) => machines) },
  );

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
    const app = new fly.App('WebAppAutoscalerFlyApp', {
      org: process.env.FLY_ORG,
      name: `${$app.name}-${$app.stage}-webapp-autoscaler`,
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
      'WebAppAutoscalerFlyMachine',
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
