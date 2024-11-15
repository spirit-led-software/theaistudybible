import { lucia } from '@/core/auth';
import { db } from '@/core/database';
import { userCredits } from '@/core/database/schema';
import { sentryBeforeResponseMiddleware } from '@sentry/solidstart';
import { createMiddleware } from '@solidjs/start/middleware';
import { add, isAfter } from 'date-fns';
import { sql } from 'drizzle-orm';
import { eq } from 'drizzle-orm';
import { Resource } from 'sst';
import { getCookie, setCookie } from 'vinxi/http';

export default createMiddleware({
  onRequest: [
    // Logging Middleware
    async ({ request }) => {
      const url = new URL(request.url);
      console.log(`<-- ${request.method} ${url.pathname}`);
      if (Resource.Dev.value === 'true') {
        const body = await request.clone().text();
        if (body) console.log(`\t\t${body}`);
      }
    },
    // Auth Middleware
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
    // Logging Middleware
    ({ request, response }) => {
      const url = new URL(request.url);
      console.log(`--> ${request.method} ${url.pathname} ${response.status}`);
    },
    // Sentry Middleware
    sentryBeforeResponseMiddleware(),
  ],
});
