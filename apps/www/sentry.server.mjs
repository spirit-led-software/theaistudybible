// @ts-check
import * as Sentry from '@sentry/node';

Sentry.init({
  dsn: 'https://d05be7f6d9044060ebd25396600d21cf@o4507103632359424.ingest.us.sentry.io/4507974022266880',
  tracesSampleRate: process.env.PUBLIC_STAGE === 'production' ? 1.0 : 0.1,
  profilesSampleRate: process.env.PUBLIC_STAGE === 'production' ? 1.0 : 0.1,
  environment: process.env.PUBLIC_STAGE,
  registerEsmLoaderHooks: {
    onlyIncludeInstrumentedModules: true,
  },
});
