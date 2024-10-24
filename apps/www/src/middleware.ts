import { lucia } from '@/core/auth';
import { db } from '@/core/database';
import { userCredits } from '@/core/database/schema';
import { sentryBeforeResponseMiddleware } from '@sentry/solidstart';
import { createMiddleware } from '@solidjs/start/middleware';
import { add, isAfter } from 'date-fns';
import { sql } from 'drizzle-orm';
import { eq } from 'drizzle-orm';
import { verifyRequestOrigin } from 'lucia';
import { getCookie, getHeader, setCookie } from 'vinxi/http';

export default createMiddleware({
  onRequest: [
    ({ request }) => {
      const url = new URL(request.url);
      console.log(`Request: ${request.method} ${url.pathname}`);
    },
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

      if (user) {
        const [userCredit] = await db
          .select()
          .from(userCredits)
          .where(eq(userCredits.userId, user.id));

        if (userCredit) {
          const twentyFourHoursAfterLastCredit = add(userCredit.lastSignInCreditAt ?? new Date(), {
            hours: 24,
          });
          if (
            !userCredit.lastSignInCreditAt ||
            isAfter(new Date(), twentyFourHoursAfterLastCredit)
          ) {
            await db
              .update(userCredits)
              .set({
                balance: sql`${userCredits.balance} + 5`,
                lastSignInCreditAt: new Date(),
              })
              .where(eq(userCredits.userId, user.id));
          }
        } else {
          await db.insert(userCredits).values({
            userId: user.id,
            lastSignInCreditAt: new Date(),
          });
        }
      }

      locals.session = session;
      locals.user = user;
      locals.roles = roles;
    },
  ],
  onBeforeResponse: [
    ({ request, response }) => {
      const url = new URL(request.url);
      console.log(
        `Response: ${request.method} ${url.pathname} ${response.status} ${response.statusText ?? ''}`,
      );
    },
    sentryBeforeResponseMiddleware(),
  ],
});
