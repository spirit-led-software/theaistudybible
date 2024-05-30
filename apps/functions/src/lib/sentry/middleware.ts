import middy from '@middy/core';
import * as Sentry from '@sentry/node';

const sentryMiddleware = (): middy.MiddlewareObj => ({
  onError: ({ error }) => {
    Sentry.captureException(error);
  }
});

export default sentryMiddleware;
