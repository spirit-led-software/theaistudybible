import { db } from '@/core/database';
import { userCredits, userSettings } from '@/core/database/schema';
import type { FetchEvent } from '@solidjs/start/server';
import { sql } from 'drizzle-orm';
import { authenticate } from '../auth';

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
        .values({ userId: user.id, emailNotifications: true, preferredBibleId: null })
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
      db
        .insert(userCredits)
        .values({ userId: user.id, lastSignInCreditAt: new Date() })
        .onConflictDoUpdate({
          target: [userCredits.userId],
          set: {
            lastSignInCreditAt: sql`CASE
              WHEN ${userCredits.lastSignInCreditAt} IS NULL
                OR datetime(${userCredits.lastSignInCreditAt}, '+24 hours') <= CURRENT_TIMESTAMP 
              THEN CURRENT_TIMESTAMP
              ELSE ${userCredits.lastSignInCreditAt}
            END`,
            balance: sql`CASE 
              WHEN ${userCredits.lastSignInCreditAt} IS NULL 
                OR datetime(${userCredits.lastSignInCreditAt}, '+24 hours') <= CURRENT_TIMESTAMP 
              THEN ${userCredits.balance} + 5 
              ELSE ${userCredits.balance} 
            END`,
          },
        })
        .returning(),
    ]);

    Object.assign(locals, { session, user, roles, settings });
  };
};
