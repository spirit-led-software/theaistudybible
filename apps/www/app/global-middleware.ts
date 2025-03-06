import { registerGlobalMiddleware } from '@tanstack/react-start';
import { authMiddleware } from './server/middleware/auth';
import { rateLimitingMiddleware } from './server/middleware/rate-limiting';

registerGlobalMiddleware({
  middleware: [rateLimitingMiddleware, authMiddleware],
});
