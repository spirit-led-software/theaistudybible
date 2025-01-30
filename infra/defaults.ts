import * as constants from './constants';
import * as databases from './database';
import * as email from './email';
import { webAppSentryKey } from './monitoring';
import * as queues from './queues';
import * as secrets from './secrets';
import * as storage from './storage';
import * as stripe from './stripe';
import { isProd } from './utils/constants';

export const allLinks = $output([
  ...Object.values(constants),
  ...Object.values(secrets),
  ...Object.values(storage),
  ...Object.values(databases),
  ...Object.values(email),
  ...Object.values(queues),
  ...Object.values(stripe),
]);

$transform(sst.aws.Function, (args) => {
  args.copyFiles = $output(args.copyFiles).apply((copyFiles = []) => [
    ...copyFiles,
    { from: 'apps/functions/instrument.mjs', to: 'instrument.mjs' },
  ]);
  args.runtime ??= 'nodejs22.x';
  args.nodejs = $output(args.nodejs).apply((nodejs = {}) => ({
    ...nodejs,
    install: [
      ...(nodejs.install ?? []),
      '@libsql/client',
      'tiktoken',
      '@node-rs/argon2',
      '@node-rs/bcrypt',
      '@sentry/aws-serverless',
      'posthog-node',
    ],
    esbuild: {
      external: [
        ...(nodejs.esbuild?.external ?? []),
        '@libsql/client',
        'tiktoken',
        '@node-rs/argon2',
        '@node-rs/bcrypt',
        '@sentry/aws-serverless',
        'posthog-node',
      ],
    },
  }));
  args.memory ??= '512 MB';
  args.environment = $util
    .all([
      constants.POSTHOG_API_KEY.value,
      constants.POSTHOG_API_HOST.value,
      webAppSentryKey.organization,
      webAppSentryKey.project,
      secrets.SENTRY_AUTH_TOKEN.value,
      webAppSentryKey.dsnPublic,
      args.environment,
    ])
    .apply(
      ([
        posthogApiKey,
        posthogApiHost,
        sentryOrg,
        sentryProject,
        sentryAuthToken,
        sentryDsnPublic,
        argsEnv,
      ]) => ({
        STAGE: $app.stage,
        NODE_OPTIONS: '--import ./instrument.mjs',
        POSTHOG_API_KEY: posthogApiKey,
        POSTHOG_API_HOST: posthogApiHost,
        SENTRY_ORG: sentryOrg,
        SENTRY_PROJECT: sentryProject,
        SENTRY_AUTH_TOKEN: sentryAuthToken,
        SENTRY_DSN: sentryDsnPublic,
        SENTRY_TRACES_SAMPLE_RATE: ($dev ? 0 : isProd ? 1.0 : 0.5).toString(),
        ...argsEnv,
      }),
    );
  args.link = $util
    .all([args.link, allLinks])
    .apply(([links = [], allLinks]) => [...links, ...allLinks]);
});
