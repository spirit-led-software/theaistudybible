import { ANALYTICS_URL } from './analytics';
import { cdn } from './cdn';
import {
  CLOUDFLARE_IP_RANGES,
  CLOUDFLARE_ZONE,
  POSTHOG_API_KEY,
  POSTHOG_UI_HOST,
  STRIPE_PUBLISHABLE_KEY,
  WEBAPP_URL,
  isProd,
} from './constants';
import { allLinks } from './defaults';
import { webAppSentryKey, webAppSentryProject } from './monitoring';
import { awsApSoutheast1, awsUsEast1 } from './providers';
import { cloudflareHelpers } from './resources';
import { SENTRY_AUTH_TOKEN } from './secrets';

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

const commonWebAppConfig: Partial<sst.aws.ClusterServiceArgs> = {
  image: { dockerfile: 'docker/www.Dockerfile', args: buildArgs, context: process.cwd() },
  link: allLinks,
  environment: env,
  loadBalancer: {
    ports: [
      { listen: '80/http', forward: '3000/http' },
      { listen: '443/https', forward: '3000/http' },
    ],
  },
  cpu: '0.25 vCPU',
  memory: '0.5 GB',
  scaling: { min: 1, max: 2, cpuUtilization: 90, memoryUtilization: 90 },
  transform: {
    image: (args) => {
      args.cacheFrom = [{ local: { src: '/tmp/.buildx-cache' } }];
      args.cacheTo = [{ local: { dest: '/tmp/.buildx-cache-new', mode: 'max' } }];
    },
    loadBalancerSecurityGroup: (args) => {
      args.ingress = [
        {
          fromPort: 80,
          toPort: 80,
          protocol: 'tcp',
          cidrBlocks: CLOUDFLARE_IP_RANGES.ipv4CidrBlocks,
          ipv6CidrBlocks: CLOUDFLARE_IP_RANGES.ipv6CidrBlocks,
        },
        {
          fromPort: 443,
          toPort: 443,
          protocol: 'tcp',
          cidrBlocks: CLOUDFLARE_IP_RANGES.ipv4CidrBlocks,
          ipv6CidrBlocks: CLOUDFLARE_IP_RANGES.ipv6CidrBlocks,
        },
      ];
    },
  },
};

export const vpcUsEast1 = new sst.aws.Vpc('Vpc-UsEast1', {}, { provider: awsUsEast1 });
export const clusterUsEast1 = new sst.aws.Cluster('Cluster-UsEast1', { vpc: vpcUsEast1 });
export const webAppUsEast1 = clusterUsEast1.addService('WebApp-UsEast1', {
  ...commonWebAppConfig,
  // Only need to run dev in one region
  dev: { autostart: true, command: 'bun run dev', directory: 'apps/www', url: WEBAPP_URL.value },
});

export const vpcApSouthEast1 = new sst.aws.Vpc(
  'Vpc-ApSouthEast1',
  {},
  { provider: awsApSoutheast1 },
);
export const clusterApSoutheast1 = new sst.aws.Cluster(
  'Cluster-ApSoutheast1',
  { vpc: vpcApSouthEast1 },
  { provider: awsApSoutheast1 },
);
export const webAppApSoutheast1 = clusterApSoutheast1.addService('WebApp-ApSoutheast1', {
  ...commonWebAppConfig,
  // Smaller max scale in less-used region
  scaling: { ...commonWebAppConfig.scaling, max: 1 },
});

if (!$dev) {
  const usEast1LoadBalancerPool = new cloudflare.LoadBalancerPool('LoadBalancerPool-UsEast1', {
    accountId: CLOUDFLARE_ZONE.accountId,
    name: `${$app.name}-${$app.stage}-us-east-1-lb-pool`,
    origins: [
      {
        name: webAppUsEast1.nodes.loadBalancer.name,
        address: webAppUsEast1.nodes.loadBalancer.dnsName,
      },
    ],
  });
  const apSoutheast1LoadBalancerPool = new cloudflare.LoadBalancerPool(
    'LoadBalancerPool-ApSoutheast1',
    {
      accountId: CLOUDFLARE_ZONE.accountId,
      name: `${$app.name}-${$app.stage}-ap-southeast-1-load-balancer-pool`,
      origins: [
        {
          name: webAppApSoutheast1.nodes.loadBalancer.name,
          address: webAppApSoutheast1.nodes.loadBalancer.dnsName,
        },
      ],
    },
  );

  const globalLoadBalancer = new cloudflare.LoadBalancer('GlobalLoadBalancer', {
    zoneId: CLOUDFLARE_ZONE.zoneId,
    name: `${$app.name}-${$app.stage}-global-lb`,
    defaultPoolIds: [usEast1LoadBalancerPool.id, apSoutheast1LoadBalancerPool.id],
    fallbackPoolId: usEast1LoadBalancerPool.id,
    regionPools: [
      { region: 'WNAM', poolIds: [usEast1LoadBalancerPool.id] },
      { region: 'ENAM', poolIds: [usEast1LoadBalancerPool.id] },
      { region: 'NSAM', poolIds: [usEast1LoadBalancerPool.id] },
      { region: 'SSAM', poolIds: [usEast1LoadBalancerPool.id] },
      { region: 'WEU', poolIds: [usEast1LoadBalancerPool.id] },
      { region: 'EEU', poolIds: [usEast1LoadBalancerPool.id] },
      { region: 'NAF', poolIds: [apSoutheast1LoadBalancerPool.id] },
      { region: 'SAF', poolIds: [apSoutheast1LoadBalancerPool.id] },
      { region: 'ME', poolIds: [apSoutheast1LoadBalancerPool.id] },
      { region: 'SAS', poolIds: [apSoutheast1LoadBalancerPool.id] },
      { region: 'SEAS', poolIds: [apSoutheast1LoadBalancerPool.id] },
      { region: 'NEAS', poolIds: [apSoutheast1LoadBalancerPool.id] },
      { region: 'OC', poolIds: [apSoutheast1LoadBalancerPool.id] },
    ],
    steeringPolicy: 'geo',
  });

  const globalLoadBalancerCnameRecord = new cloudflare.Record('GlobalLoadBalancerCnameRecord', {
    zoneId: CLOUDFLARE_ZONE.zoneId,
    type: 'CNAME',
    name: isProd ? '@' : $app.stage,
    content: globalLoadBalancer.name.apply((name) => `${name}.${CLOUDFLARE_ZONE.name}`),
    proxied: true,
  });

  if (isProd) {
    const cacheRuleset = new cloudflare.Ruleset(
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
      { dependsOn: [globalLoadBalancerCnameRecord] },
    );
    new cloudflareHelpers.PurgeCache(
      'PurgeCache',
      {
        zoneId: CLOUDFLARE_ZONE.zoneId,
        triggers: [
          webAppUsEast1.nodes.taskDefinition.revision.apply((revision) => revision.toString()),
          webAppApSoutheast1.nodes.taskDefinition.revision.apply((revision) => revision.toString()),
        ],
        purge_everything: true,
      },
      { dependsOn: [cacheRuleset, globalLoadBalancerCnameRecord] },
    );
  }
}
