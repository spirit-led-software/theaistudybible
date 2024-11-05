import { ANALYTICS_URL } from './analytics';
import { cdn } from './cdn';
import * as constants from './constants';
import * as databases from './database';
import { email } from './email';
import { webAppSentryKey } from './monitoring';
import * as queues from './queues';
import { Constant } from './resources';
import * as secrets from './secrets';
import * as storage from './storage';
import { WEBHOOKS_URL } from './webhooks';

export const allLinks = [
  ...Object.values(constants).filter((l) => l instanceof Constant),
  ANALYTICS_URL,
  WEBHOOKS_URL,
  ...Object.values(secrets),
  ...Object.values(storage),
  cdn,
  ...Object.values(databases),
  ...Object.values(queues),
  email,
];

/**
 * Define defaults for all SST functions
 */
$transform(sst.aws.Function, (args) => {
  args.runtime ??= 'nodejs20.x';
  args.memory ??= '512 MB';
  // biome-ignore lint/suspicious/noExplicitAny: Don't care about the type
  args.link = $output(args.link).apply((links: sst.Linkable<any>[] = []) =>
    Array.from(new Set([...links, ...allLinks])),
  );
  args.nodejs = $output(args.nodejs).apply((nodejs) => ({
    ...nodejs,
    install: Array.from(
      new Set([...(nodejs?.install || []), '@libsql/client', '@sentry/aws-serverless']),
    ),
    esbuild: {
      ...nodejs?.esbuild,
      external: Array.from(
        new Set([...(nodejs?.esbuild?.external || []), '@sentry/aws-serverless']),
      ),
    },
  }));
  args.environment = $util
    .all([args.environment, webAppSentryKey.dsnPublic])
    .apply(([environment, sentryDsnPublic]) => ({
      ...environment,
      NODE_OPTIONS: '--import @sentry/aws-serverless/awslambda-auto',
      SENTRY_DSN: sentryDsnPublic,
      SENTRY_TRACES_SAMPLE_RATE: ($dev ? 0 : constants.isProd ? 1.0 : 0.5).toString(),
    }));
});
