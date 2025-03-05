import { registerGlobalMiddleware } from '@tanstack/react-start';
import { authMiddleware } from './server/middleware/auth';
import { loggingMiddleware } from './server/middleware/logging';
import { rateLimitingMiddleware } from './server/middleware/rate-limiting';

registerGlobalMiddleware({
  middleware: [rateLimitingMiddleware, loggingMiddleware, authMiddleware],
});
