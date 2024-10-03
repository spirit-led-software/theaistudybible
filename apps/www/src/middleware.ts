import { lucia } from '@/core/auth';
import { db } from '@/core/database';
import { createMiddleware } from '@solidjs/start/middleware';
import { appendHeader, getCookie } from 'vinxi/http';

export default createMiddleware({
  onRequest: [
    async ({ nativeEvent, locals }) => {
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
        appendHeader(nativeEvent, 'Set-Cookie', cookie.serialize());
      }
      if (!session) {
        const cookie = lucia.createBlankSessionCookie();
        appendHeader(nativeEvent, 'Set-Cookie', cookie.serialize());
        locals.session = null;
        locals.user = null;
        locals.roles = null;
        return;
      }

      const roles = await db.query.usersToRoles
        .findMany({
          where: (usersToRoles, { eq }) => eq(usersToRoles.userId, user!.id),
          with: { role: true },
        })
        .then((roles) => roles.map((role) => role.role));

      locals.session = session;
      locals.user = user;
      locals.roles = roles;
    },
  ],
});
