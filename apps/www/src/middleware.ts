import { sentryBeforeResponseMiddleware } from '@sentry/solidstart';
import { createMiddleware } from '@solidjs/start/middleware';
import { authMiddleware } from './server/middleware/auth';
import { loggingMiddleware } from './server/middleware/logging';
import { rateLimitingMiddleware } from './server/middleware/rate-limiting';

export default createMiddleware({
  onRequest: [loggingMiddleware.onRequest(), rateLimitingMiddleware(), authMiddleware()],
  onBeforeResponse: [loggingMiddleware.onBeforeResponse(), sentryBeforeResponseMiddleware()],
});
