import {
  CLOUDFLARE_IPV4_RANGES,
  CLOUDFLARE_IPV6_RANGES,
  CLOUDFLARE_ZONE_ID,
  DOMAIN,
  STRIPE_PUBLISHABLE_KEY,
} from './constants';
import { allLinks } from './defaults';
import { SENTRY_AUTH_TOKEN } from './secrets';
import { cdn } from './storage';

export const vpc = new sst.aws.Vpc('Vpc');

export const cluster = new sst.aws.Cluster('Cluster', { vpc });

export const webAppImageRegistry = new aws.ecr.Repository('WebAppImageRegistry', {
  name: `${$app.name}-${$app.stage}-webapp-registry`,
  forceDelete: true,
});
export const webAppImageRegistryToken = aws.ecr.getAuthorizationTokenOutput({
  registryId: webAppImageRegistry.registryId,
});

const webAppEnv = {
  PUBLIC_WEBSITE_URL: $dev ? 'https://localhost:3000' : `https://${DOMAIN.value}`,
  PUBLIC_CDN_URL: cdn.url,
  PUBLIC_STRIPE_PUBLISHABLE_KEY: STRIPE_PUBLISHABLE_KEY.value,
  PUBLIC_STAGE: $app.stage,
};

export const webapp = cluster.addService('WebAppService', {
  image: {
    dockerfile: 'docker/webapp.Dockerfile',
    args: {
      sentry_auth_token: SENTRY_AUTH_TOKEN.value,
      website_url: $dev ? 'https://localhost:3000' : `https://${DOMAIN.value}`,
      cdn_url: cdn.url,
      stripe_publishable_key: STRIPE_PUBLISHABLE_KEY.value,
      stage: $app.stage,
    },
  },
  link: allLinks,
  environment: webAppEnv,
  public: {
    ports: [{ listen: '443/https', forward: '3000/http' }],
    domain: {
      name: DOMAIN.value,
      dns: sst.cloudflare.dns({
        transform: {
          record: (record) => {
            if (record.name === DOMAIN.value) {
              record.proxied = true;
              record.ttl = 1;
            }
          },
        },
      }),
    },
  },
  architecture: 'arm64',
  scaling: {
    min: 1,
    max: $app.stage === 'production' ? 4 : 1,
    cpuUtilization: 90,
    memoryUtilization: 90,
  },
  transform: {
    loadBalancerSecurityGroup: (args) => {
      args.ingress = [
        {
          protocol: 'tcp',
          fromPort: 80,
          toPort: 80,
          cidrBlocks: CLOUDFLARE_IPV4_RANGES,
          ipv6CidrBlocks: CLOUDFLARE_IPV6_RANGES,
        },
        {
          protocol: 'tcp',
          fromPort: 443,
          toPort: 443,
          cidrBlocks: CLOUDFLARE_IPV4_RANGES,
          ipv6CidrBlocks: CLOUDFLARE_IPV6_RANGES,
        },
      ];
    },
    image: {
      tags: [$interpolate`${webAppImageRegistry.repositoryUrl}:latest`],
      cacheFrom: [{ registry: { ref: $interpolate`${webAppImageRegistry.repositoryUrl}:latest` } }],
      registries: [
        {
          address: webAppImageRegistryToken.proxyEndpoint,
          username: webAppImageRegistryToken.userName,
          password: $util.secret(webAppImageRegistryToken.password),
        },
      ],
      network: 'host',
    },
  },
});

if ($app.stage === 'production') {
  new cloudflare.Ruleset(`${$app.stage}-CacheRuleset`, {
    kind: 'zone',
    zoneId: CLOUDFLARE_ZONE_ID,
    name: `${$app.stage}-cacheruleset`,
    phase: 'http_request_cache_settings',
    rules: [
      {
        expression:
          '(http.request.uri.path.extension in {"7z" "avi" "avif" "apk" "bin" "bmp" "bz2" "class" "css" "csv" "doc" "docx" "dmg" "ejs" "eot" "eps" "exe" "flac" "gif" "gz" "ico" "iso" "jar" "jpg" "jpeg" "js" "mid" "midi" "mkv" "mp3" "mp4" "ogg" "otf" "pdf" "pict" "pls" "png" "ppt" "pptx" "ps" "rar" "svg" "svgz" "swf" "tar" "tif" "tiff" "ttf" "webm" "webp" "woff" "woff2" "xls" "xlsx" "zip" "zst"})',
        action: 'set_cache_settings',
        actionParameters: {
          cache: true,
        },
      },
    ],
  });
}

export const webAppDev = new sst.x.DevCommand('WebAppDev', {
  dev: {
    directory: 'apps/www',
    command: 'bun run dev',
  },
  link: allLinks,
  environment: webAppEnv,
});
