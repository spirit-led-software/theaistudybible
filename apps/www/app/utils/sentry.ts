const isProd = import.meta.env.PUBLIC_STAGE === 'production';
const isDev = import.meta.env.PUBLIC_DEV === 'true';

export async function initSentry() {
  const Sentry = await import('@sentry/solidstart');
  const { solidRouterBrowserTracingIntegration } = await import('@sentry/solidstart/solidrouter');

  Sentry.init({
    dsn: import.meta.env.PUBLIC_SENTRY_DSN,
    integrations: [solidRouterBrowserTracingIntegration()],
    tracesSampleRate: isDev ? 0 : isProd ? 1.0 : 0.5,
    environment: import.meta.env.PUBLIC_STAGE,
  });
}
