import * as Sentry from '@sentry/aws-serverless';
import { nodeProfilingIntegration } from '@sentry/profiling-node';
import { Resource } from 'sst';

const isProd = Resource.Stage.value === 'production';
const isDev = Resource.Dev.value === 'true';

Sentry.init({
  dsn: 'https://795730c6439d3fbbb5578249c85386b0@o4508042228006912.ingest.us.sentry.io/4508135125876736',
  integrations: [nodeProfilingIntegration()],
  tracesSampleRate: isDev ? 0 : isProd ? 1.0 : 0.5,
  profilesSampleRate: isDev ? 0 : isProd ? 0.75 : 0.25,
});
