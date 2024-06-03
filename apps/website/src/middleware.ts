import { createMiddleware } from '@solidjs/start/middleware';
import { getCookie } from 'vinxi/http';
import { clerk } from './lib/server/clerk';

export default createMiddleware({
  onRequest: [
    async ({ locals }) => {
      const sessionToken = getCookie('__session');
      if (sessionToken) {
        try {
          const claims = await clerk.verifyToken(sessionToken);
          locals.auth = {
            userId: claims.sub,
            claims
          };
        } catch (e) {
          console.warn('Failed to verify session token:', e);
        }
      }
    }
  ]
});
