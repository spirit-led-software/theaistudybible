import * as Sentry from '@sentry/aws-serverless';
import type { Handler } from 'aws-lambda';

export const withSentry = (handler: Handler) => {
  Sentry.init({
    dsn: 'https://eb48e0c156da9fd71a1329f75f76e8f6@o4507103632359424.ingest.us.sentry.io/4507306886758400',
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 1.0 : 0.0
  });

  return Sentry.wrapHandler(handler);
};
