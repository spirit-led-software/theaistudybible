import { lucia } from '@/core/auth';
import { db } from '@/core/database';
import { createMiddleware } from '@solidjs/start/middleware';
import { verifyRequestOrigin } from 'lucia';
import { getCookie, getHeader, setCookie } from 'vinxi/http';

export default createMiddleware({
  onRequest: [
    async ({ nativeEvent, locals }) => {
      if (nativeEvent.node.req.method !== 'GET') {
        const originHeader = getHeader(nativeEvent, 'Origin') ?? null;
        const hostHeader = getHeader(nativeEvent, 'Host') ?? null;
        if (!originHeader || !hostHeader || !verifyRequestOrigin(originHeader, [hostHeader])) {
          nativeEvent.node.res.writeHead(403).end();
          return;
        }
      }

      const sessionId = getCookie(nativeEvent, lucia.sessionCookieName) ?? null;
      if (!sessionId) {
        locals.session = null;
        locals.user = null;
        locals.roles = null;
        return;
      }

      const { session, user } = await lucia.validateSession(sessionId);
      if (session?.fresh) {
        const cookie = lucia.createSessionCookie(session.id);
        setCookie(nativeEvent, cookie.name, cookie.value, cookie.attributes);
      }
      if (!session) {
        const cookie = lucia.createBlankSessionCookie();
        setCookie(nativeEvent, cookie.name, cookie.value, cookie.attributes);
      }

      const roles = await db.query.usersToRoles
        .findMany({
          where: (usersToRoles, { eq }) => eq(usersToRoles.userId, user!.id),
          with: {
            role: true,
          },
        })
        .then((roles) => roles.map((role) => role.role));

      locals.session = session;
      locals.user = user;
      locals.roles = roles;
    },
  ],
});
