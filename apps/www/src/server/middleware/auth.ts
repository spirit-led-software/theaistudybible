import { db } from '@/core/database';
import { userSettings } from '@/core/database/schema';
import { getPosthog } from '@/core/utils/posthog';
import { setUser as setSentryUser } from '@sentry/solidstart';
import type { FetchEvent } from '@solidjs/start/server';
import { sql } from 'drizzle-orm';
import { authenticate } from '../utils/auth';

export const authMiddleware = () => {
  return async ({ nativeEvent, locals }: FetchEvent) => {
    const { session, user } = await authenticate(nativeEvent);
    if (!session || !user) {
      Object.assign(locals, { session: null, user: null, settings: null, roles: null });
      return;
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

    Object.assign(locals, { session, user, roles, settings });
  };
};
