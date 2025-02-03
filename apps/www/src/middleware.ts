import { sentryBeforeResponseMiddleware } from '@sentry/solidstart';
import { createMiddleware } from '@solidjs/start/middleware';
import { authMiddleware } from './server/middleware/auth';
import { flyDevRedirectOnRequest } from './server/middleware/fly.dev-redirect';
import { loggingMiddleware } from './server/middleware/logging';
import { rateLimitingMiddleware } from './server/middleware/rate-limiting';

export default createMiddleware({
  onRequest: [
    loggingMiddleware.onRequest(),
    flyDevRedirectOnRequest(),
    rateLimitingMiddleware(),
    authMiddleware(),
  ],
  onBeforeResponse: [loggingMiddleware.onBeforeResponse(), sentryBeforeResponseMiddleware()],
});
