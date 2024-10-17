import path from 'node:path';
import { cdn } from './cdn';
import { STRIPE_PUBLISHABLE_KEY, WEBAPP_URL } from './constants';
import { allLinks } from './defaults';
import { webAppSentryKey, webAppSentryProject } from './monitoring';
import { SENTRY_AUTH_TOKEN } from './secrets';

export const webAppEnv = {
  PUBLIC_WEBAPP_URL: WEBAPP_URL.value,
  PUBLIC_CDN_URL: cdn.url,
  PUBLIC_STRIPE_PUBLISHABLE_KEY: STRIPE_PUBLISHABLE_KEY.value,
  PUBLIC_STAGE: $app.stage,
  PUBLIC_SENTRY_DSN: webAppSentryKey?.dsnPublic ?? '',
};

export const webAppImageRepo = new aws.ecr.Repository('WebAppImageRepository', {
  name: `${$app.name}-${$app.stage}-webapp`,
  forceDelete: true,
});

export let webAppBuildImage: dockerbuild.Image | undefined;
if (!$dev) {
  webAppBuildImage = new dockerbuild.Image('WebAppImage', {
    tags: [$interpolate`${webAppImageRepo.repositoryUrl}:latest`],
    registries: [
      aws.ecr.getAuthorizationTokenOutput({ registryId: webAppImageRepo.id }).apply((auth) => ({
        address: auth.proxyEndpoint,
        username: auth.userName,
        password: $util.secret(auth.password),
      })),
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

export const webAppDevCommand = new sst.x.DevCommand('WebAppDev', {
  dev: { autostart: true, directory: 'apps/www', command: 'bun run dev' },
  link: allLinks,
  environment: webAppEnv,
});
