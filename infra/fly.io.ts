import path from 'node:path';
import { cdn } from './cdn';
import { CLOUDFLARE_ZONE, STRIPE_PUBLISHABLE_KEY, WEBAPP_URL, isProd } from './constants';
import { allLinks } from './defaults';
import { buildLinks } from './helpers/link';
import { webAppSentryKey, webAppSentryProject } from './monitoring';
import * as queues from './queues';
import { cloudflareHelpers } from './resources';
import { SENTRY_AUTH_TOKEN } from './secrets';
import * as storage from './storage';
import { webAppEnv } from './www';

export type FlyRegion =
  // Regular regions
  | 'ams' // Amsterdam, Netherlands
  | 'arn' // Stockholm, Sweden
  | 'atl' // Atlanta, Georgia (US)
  | 'bog' // Bogotá, Colombia
  | 'bom' // Mumbai, India
  | 'bos' // Boston, Massachusetts (US)
  | 'cdg' // Paris, France
  | 'den' // Denver, Colorado (US)
  | 'dfw' // Dallas, Texas (US)
  | 'ewr' // Secaucus, NJ (US)
  | 'eze' // Ezeiza, Argentina
  | 'fra' // Frankfurt, Germany
  | 'gdl' // Guadalajara, Mexico
  | 'gig' // Rio de Janeiro, Brazil
  | 'gru' // Sao Paulo, Brazil
  | 'hkg' // Hong Kong, Hong Kong
  | 'iad' // Ashburn, Virginia (US)
  | 'jnb' // Johannesburg, South Africa
  | 'lax' // Los Angeles, California (US)
  | 'lhr' // London, United Kingdom
  | 'mad' // Madrid, Spain
  | 'mia' // Miami, Florida (US)
  | 'nrt' // Tokyo, Japan
  | 'ord' // Chicago, Illinois (US)
  | 'otp' // Bucharest, Romania
  | 'phx' // Phoenix, Arizona (US)
  | 'qro' // Querétaro, Mexico
  | 'scl' // Santiago, Chile
  | 'sea' // Seattle, Washington (US)
  | 'sin' // Singapore, Singapore
  | 'sjc' // San Jose, California (US)
  | 'syd' // Sydney, Australia
  | 'waw' // Warsaw, Poland
  | 'yul' // Montreal, Canada
  | 'yyz'; // Toronto, Canada

export const flyRegions: FlyRegion[] = isProd ? ['iad', 'fra', 'sin'] : ['iad'];

export let flyApp: fly.App | undefined;
export let webAppBuildImage: dockerbuild.Image | undefined;
export let flyMachines: fly.Machine[] | undefined;
if (!$dev) {
  flyApp = new fly.App('FlyApp', { name: `${$app.name}-${$app.stage}` });
  new fly.Ip('FlyIpv4', { app: flyApp.name, type: 'v4' });
  new fly.Ip('FlyIpv6', { app: flyApp.name, type: 'v6' });

  webAppBuildImage = buildWebAppImage();
  const { flyAwsAccessKey } = buildFlyIamUser();
  const links = buildLinks(allLinks);

  flyMachines = [];
  for (const region of flyRegions) {
    flyMachines.push(
      new fly.Machine(`FlyMachine-${region}-${Date.now()}`, {
        app: flyApp.name,
        region,
        name: `${$app.stage}-${region}-${Date.now()}`,
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
        cpus: 1,
        memory: 1024,
        env: {
          ...$output(links).apply((links) =>
            links.reduce(
              (acc, l) => {
                acc[`SST_RESOURCE_${l.name}`] = JSON.stringify(l.properties);
                return acc;
              },
              {} as Record<string, string>,
            ),
          ),
          SST_RESOURCE_App: JSON.stringify({ name: $app.name, stage: $app.stage }),
          ...webAppEnv,
          AWS_ACCESS_KEY_ID: flyAwsAccessKey.id,
          AWS_SECRET_ACCESS_KEY: $util.secret(flyAwsAccessKey.secret),
          AWS_REGION: $app.providers?.aws.region ?? 'us-east-1',
        },
      }),
    );
  }

  buildCloudflareRecordsAndCache();

  function buildWebAppImage() {
    return new dockerbuild.Image('WebAppImage', {
      tags: [$interpolate`registry.fly.io/${flyApp!.name}:latest`],
      registries: [
        {
          address: 'registry.fly.io',
          username: 'x',
          password: $util.secret(process.env.FLY_API_TOKEN!),
        },
      ],
      dockerfile: { location: path.join(process.cwd(), 'docker/www.Dockerfile') },
      context: { location: process.cwd() },
      buildArgs: {
        webapp_url: WEBAPP_URL.value,
        cdn_url: cdn.url,
        stripe_publishable_key: STRIPE_PUBLISHABLE_KEY.value,
        stage: $app.stage,
        sentry_dsn: webAppSentryKey?.dsnPublic ?? '',
        sentry_org: webAppSentryProject?.organization ?? '',
        sentry_project: webAppSentryProject?.name ?? '',
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

  function buildCloudflareRecordsAndCache() {
    new cloudflare.Record('WebAppCnameRecord', {
      zoneId: CLOUDFLARE_ZONE.zoneId,
      type: 'CNAME',
      name: isProd ? '@' : $app.stage,
      value: $interpolate`${flyApp!.name}.fly.dev`,
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
        { dependsOn: [...flyMachines!] },
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
}
