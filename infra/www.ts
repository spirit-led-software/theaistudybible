import { join } from 'node:path';
import { cdn } from './cdn';
import { DOMAIN, STRIPE_PUBLISHABLE_KEY } from './constants';
import { allLinks } from './defaults';
import { webAppSentryKey, webAppSentryProject } from './monitoring';

export const webAppEnv = {
  PUBLIC_SENTRY_DSN: webAppSentryKey?.dsnPublic ?? '',
  PUBLIC_WEBSITE_URL: $dev ? 'https://localhost:3000' : `https://${DOMAIN.value}`,
  PUBLIC_CDN_URL: cdn.url,
  PUBLIC_STRIPE_PUBLISHABLE_KEY: STRIPE_PUBLISHABLE_KEY.value,
  PUBLIC_STAGE: $app.stage,
};

export const webAppImageRepo = new aws.ecr.Repository('WebAppImageRepository', {
  name: `${$app.name}-${$app.stage}-webapp`,
  forceDelete: true,
});

export const webAppBuildImage = new dockerbuild.Image('WebAppImage', {
  tags: [$interpolate`${webAppImageRepo.repositoryUrl}:latest`],
  registries: [
    aws.ecr
      .getAuthorizationTokenOutput({
        registryId: webAppImageRepo.id,
      })
      .apply((auth) => ({
        address: auth.proxyEndpoint,
        username: auth.userName,
        password: $util.secret(auth.password),
      })),
  ],
  dockerfile: {
    location: join(process.cwd(), 'docker/www.Dockerfile'),
  },
  context: {
    location: process.cwd(),
  },
  buildArgs: {
    sentry_org: webAppSentryProject?.organization ?? '',
    sentry_project: webAppSentryProject?.name ?? '',
    sentry_auth_token: versesentry.config.token ?? '',
    sentry_dsn: webAppSentryKey?.dsnPublic ?? '',
    website_url: `https://${DOMAIN.value}`,
    cdn_url: cdn.url,
    stripe_publishable_key: STRIPE_PUBLISHABLE_KEY.value,
    stage: $app.stage,
  },
  platforms: ['linux/amd64'],
  push: true,
  network: 'host',
  cacheFrom: [{ local: { src: '/tmp/.buildx-cache' } }],
  cacheTo: [{ local: { dest: '/tmp/.buildx-cache', mode: 'max' } }],
});

export const webAppDevCommand = new sst.x.DevCommand('WebAppDev', {
  dev: {
    autostart: true,
    directory: 'apps/www',
    command: 'bun dev',
  },
  link: allLinks,
  environment: webAppEnv,
});
