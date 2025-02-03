import * as Sentry from '@sentry/solidstart';

const isProd = process.env.PUBLIC_STAGE === 'production';
const isDev = process.env.PUBLIC_DEV === 'true';

Sentry.init({
  dsn: process.env.PUBLIC_SENTRY_DSN,
  // TODO: Issue with standard instrumentation:
  // https://github.com/getsentry/sentry-javascript/issues/12891
  // https://github.com/oven-sh/bun/issues/13165
  defaultIntegrations: Sentry.getDefaultIntegrations({}).filter((i) => i.name !== 'Http'),
  tracesSampleRate: isDev ? 0 : isProd ? 1.0 : 0.5,
  environment: process.env.PUBLIC_STAGE,
  registerEsmLoaderHooks: { onlyIncludeInstrumentedModules: true },
});

process.on('beforeExit', async () => {
  await Sentry.flush();
  await Sentry.close();
});
