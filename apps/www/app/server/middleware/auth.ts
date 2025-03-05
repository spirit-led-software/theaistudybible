import { db } from '@/core/database';
import { userSettings } from '@/core/database/schema';
import { getPosthog } from '@/core/utils/posthog';
import type { Role } from '@/schemas/roles/types';
import type { Session, User, UserSettings } from '@/schemas/users/types';
import { setUser as setSentryUser } from '@sentry/node';
import { redirect } from '@tanstack/react-router';
import { createMiddleware } from '@tanstack/react-start';
import { sql } from 'drizzle-orm';
import { authenticate } from '../utils/authenticate';

type AuthContext = {
  session: Session | null;
  user: User | null;
  settings: UserSettings | null;
  roles: Role[] | null;
};

export const authMiddleware = createMiddleware().server(async ({ next }) => {
  const { session, user } = await authenticate();
  if (!session || !user) {
    return next({
      context: { session: null, user: null, settings: null, roles: null } as AuthContext,
    });
  }

  // Fetch user data concurrently
  const [settings, roles] = await Promise.all([
    db
      .insert(userSettings)
      .values({ userId: user.id, emailNotifications: true, preferredBibleAbbreviation: null })
      .onConflictDoUpdate({
        target: [userSettings.userId],
        set: { id: sql`id` }, // No-op to return the existing row
      })
      .returning()
      .then((rows) => rows[0]),
    db.query.usersToRoles
      .findMany({
        where: (usersToRoles, { eq }) => eq(usersToRoles.userId, user.id),
        with: { role: true },
      })
      .then((userRoles) => userRoles.map((role) => role.role)),
  ]);

  setSentryUser({ id: user.id, email: user.email });
  getPosthog()?.identify({ distinctId: user.id, properties: { ...user } });

  return next({ context: { session, user, roles, settings } as AuthContext });
});

export const requireAuthMiddleware = createMiddleware()
  .middleware([authMiddleware])
  .server(({ context, next }) => {
    if (!context.session || !context.user) {
      throw redirect({ to: '/sign-in' });
    }
    return next({
      context: {
        ...context,
        session: context.session as Session,
        user: context.user as User,
        settings: context.settings as UserSettings,
        roles: context.roles as Role[],
      },
    });
  });
