export async function initSentry() {
  const {
    BrowserClient,
    defaultStackParser,
    getCurrentScope,
    getDefaultIntegrations,
    makeFetchTransport,
  } = await import('@sentry/solidstart');
  const { solidRouterBrowserTracingIntegration } = await import('@sentry/solidstart/solidrouter');

  const isProd = import.meta.env.PUBLIC_STAGE === 'production';
  const isDev = import.meta.env.PUBLIC_DEV === 'true';

  const sentry = new BrowserClient({
    dsn: import.meta.env.PUBLIC_SENTRY_DSN,
    stackParser: defaultStackParser,
    transport: makeFetchTransport,
    integrations: [...getDefaultIntegrations({}), solidRouterBrowserTracingIntegration()],
    tracesSampleRate: isDev ? 0 : isProd ? 1.0 : 0.5,
    environment: import.meta.env.PUBLIC_STAGE,
  });
  getCurrentScope().setClient(sentry);
  sentry.init();
}
