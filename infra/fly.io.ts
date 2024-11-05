import path from 'node:path';
import { ANALYTICS_URL } from './analytics';
import { cdn } from './cdn';
import { CLOUDFLARE_ZONE, STRIPE_PUBLISHABLE_KEY, WEBAPP_URL, isProd } from './constants';
import { allLinks } from './defaults';
import { buildLinks } from './helpers/link';
import { MONITORING_URL, webAppSentryKey, webAppSentryProject } from './monitoring';
import * as queues from './queues';
import { cloudflareHelpers } from './resources';
import { SENTRY_AUTH_TOKEN } from './secrets';
import * as storage from './storage';
import type { FlyRegion } from './types/fly.io';
import { webAppEnv } from './www';

export const FLY_ORG = process.env.FLY_ORG;
export const FLY_API_TOKEN = process.env.FLY_API_TOKEN;

export const flyRegions: FlyRegion[] = isProd ? ['iad', 'sin'] : ['iad'];

export let flyWebApp: fly.App | undefined;
export let webAppBuildImage: dockerbuild.Image | undefined;
export let flyWebAppMachines: fly.Machine[] | undefined;
if (!$dev) {
  if (!FLY_ORG || !FLY_API_TOKEN) {
    throw new Error('FLY_ORG and FLY_API_TOKEN environment variables must be set');
  }

  flyWebApp = new fly.App('FlyApp', {
    name: `${$app.name}-${$app.stage}`,
    org: FLY_ORG,
    assignSharedIpAddress: true,
  });
  const flyIpv4 = new fly.Ip('FlyIpv4', { app: flyWebApp.name, type: 'v4' });
  const flyIpv6 = new fly.Ip('FlyIpv6', { app: flyWebApp.name, type: 'v6' });

  webAppBuildImage = buildWebAppImage();
  flyWebAppMachines = buildFlyMachines();

  buildCloudflareRecordsAndCache();
  buildFlyAutoscaler();

  function buildWebAppImage() {
    return new dockerbuild.Image('WebAppImage', {
      tags: [$interpolate`registry.fly.io/${flyWebApp!.name}:latest`],
      registries: [
        { address: 'registry.fly.io', username: 'x', password: $util.secret(FLY_API_TOKEN!) },
      ],
      dockerfile: { location: path.join(process.cwd(), 'docker/www.Dockerfile') },
      context: { location: process.cwd() },
      buildArgs: {
        webapp_url: WEBAPP_URL.value,
        cdn_url: cdn.url,
        analytics_url: ANALYTICS_URL.value,
        stripe_publishable_key: STRIPE_PUBLISHABLE_KEY.value,
        stage: $app.stage,
        sentry_dsn: MONITORING_URL.value,
        sentry_org: webAppSentryKey.organization,
        sentry_project_id: webAppSentryKey.projectId.toString(),
        sentry_project_name: webAppSentryProject.name,
        sentry_auth_token: SENTRY_AUTH_TOKEN.value,
      },
      platforms: ['linux/amd64'],
      push: true,
      network: 'host',
      cacheFrom: [{ local: { src: '/tmp/.buildx-cache' } }],
      cacheTo: [{ local: { dest: '/tmp/.buildx-cache', mode: 'max' } }],
    });
  }

  function buildFlyIamUser() {
    const flyIamPolicy = new aws.iam.Policy('FlyIamPolicy', {
      policy: {
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Action: ['s3:*'],
            Resource: Object.values(storage).flatMap((b) => [
              b.nodes.bucket.arn,
              $interpolate`${b.nodes.bucket.arn}/*`,
            ]),
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
    const links = buildLinks(allLinks);
    return $util
      .all([links, webAppEnv, flyAwsAccessKey.id, $util.secret(flyAwsAccessKey.secret)])
      .apply(([links, webAppEnv, flyAwsAccessKeyId, flyAwsAccessKeySecret]) => ({
        ...links.reduce(
          (acc, l) => {
            acc[`SST_RESOURCE_${l.name}`] = JSON.stringify(l.properties);
            return acc;
          },
          {} as Record<string, string>,
        ),
        SST_RESOURCE_App: JSON.stringify({ name: $app.name, stage: $app.stage }),
        ...webAppEnv,
        AWS_ACCESS_KEY_ID: flyAwsAccessKeyId,
        AWS_SECRET_ACCESS_KEY: flyAwsAccessKeySecret,
        AWS_REGION: ($app.providers?.aws.region ?? 'us-east-1') as string,
        PRIMARY_REGION: flyRegions[0],
      }));
  }

  function buildFlyMachines() {
    const machines: fly.Machine[] = [];
    const env = buildEnv();
    for (const region of flyRegions) {
      machines.push(
        new fly.Machine(`FlyMachine-${region}`, {
          app: flyWebApp!.name,
          region,
          image: webAppBuildImage!.ref,
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
          cpus: 2,
          memory: 1024,
          env,
        }),
      );
    }
    return machines;
  }

  function buildCloudflareRecordsAndCache() {
    new cloudflare.Record('WebAppCnameRecord', {
      zoneId: CLOUDFLARE_ZONE.zoneId,
      type: 'A',
      name: isProd ? '@' : $app.stage,
      value: flyIpv4.address,
      proxied: true,
    });
    new cloudflare.Record('WebAppIpv6Record', {
      zoneId: CLOUDFLARE_ZONE.zoneId,
      type: 'AAAA',
      name: isProd ? '@' : $app.stage,
      value: flyIpv6.address,
      proxied: true,
    });
    if (isProd) {
      const ruleset = new cloudflare.Ruleset(
        `${$app.stage}-Cache-Ruleset`,
        {
          kind: 'zone',
          zoneId: CLOUDFLARE_ZONE.zoneId,
          name: `${$app.stage}-cache-ruleset`,
          phase: 'http_request_cache_settings',
          rules: [
            {
              expression:
                '(http.request.uri.path.extension in {"7z" "avi" "avif" "apk" "bin" "bmp" "bz2" "class" "css" "csv" "doc" "docx" "dmg" "ejs" "eot" "eps" "exe" "flac" "gif" "gz" "ico" "iso" "jar" "jpg" "jpeg" "js" "mid" "midi" "mkv" "mp3" "mp4" "ogg" "otf" "pdf" "pict" "pls" "png" "ppt" "pptx" "ps" "rar" "svg" "svgz" "swf" "tar" "tif" "tiff" "ttf" "webm" "webp" "woff" "woff2" "xls" "xlsx" "zip" "zst"})',
              action: 'set_cache_settings',
              actionParameters: {
                cache: true,
                edgeTtl: {
                  mode: 'override_origin',
                  default: 60 * 60 * 24, // 1 day in seconds
                },
                browserTtl: { mode: 'respect_origin' },
              },
            },
          ],
        },
        { dependsOn: [...flyWebAppMachines!] },
      );
      new cloudflareHelpers.PurgeCache(
        'PurgeCache',
        {
          zoneId: CLOUDFLARE_ZONE.zoneId,
          triggers: [webAppBuildImage!.ref],
          purge_everything: true,
        },
        { dependsOn: [ruleset] },
      );
    }
  }

  function buildFlyAutoscaler() {
    const app = new fly.App('FlyAutoscalerApp', { name: `${$app.name}-${$app.stage}-autoscaler` });
    const env = $util
      .all([$util.secret(FLY_API_TOKEN!), flyWebApp!.name])
      .apply(([flyApiToken, appName]) => ({
        FAS_ORG: FLY_ORG!,
        FAS_APP_NAME: appName,
        FAS_API_TOKEN: flyApiToken,
        FAS_REGIONS: flyRegions.join(','),
        FAS_CREATED_MACHINE_COUNT: `max(min(ceil(connects / 1000), ${flyRegions.length * 20}), ${flyRegions.length})`, // 1000 connections per machine, max 20 machines per region, min 1 machine per region
        FAS_PROMETHEUS_ADDRESS: `https://api.fly.io/prometheus/${FLY_ORG!}`,
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
      { dependsOn: [...flyWebAppMachines!] },
    );
    return { app, machine };
  }
}
