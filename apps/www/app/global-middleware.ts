import * as Sentry from '@sentry/tanstackstart-react';
import { createMiddleware, registerGlobalMiddleware } from '@tanstack/react-start';
import { authMiddleware } from './server/middleware/auth';
import { rateLimitingMiddleware } from './server/middleware/rate-limiting';

registerGlobalMiddleware({
  middleware: [
    rateLimitingMiddleware,
    authMiddleware,
    createMiddleware().server(Sentry.sentryGlobalServerMiddlewareHandler()),
  ],
});
