import { db } from '@/core/database';
import { userCredits, userSettings } from '@/core/database/schema';
import type { FetchEvent } from '@solidjs/start/server';
import { add, isAfter } from 'date-fns';
import { eq, sql } from 'drizzle-orm';
import { authenticate } from '../auth';

export const authMiddleware = () => {
  return async ({ nativeEvent, locals }: FetchEvent) => {
    const { session, user } = await authenticate(nativeEvent);
    if (!session || !user) {
      Object.assign(locals, { session: null, user: null, settings: null, roles: null });
      return;
    }

    const [settings, roles] = await Promise.all([
      db.query.userSettings
        .findFirst({ where: (userSettings, { eq }) => eq(userSettings.userId, user!.id) })
        .then(async (settings) => {
          if (!settings) {
            const [newSettings] = await db
              .insert(userSettings)
              .values({
                userId: user!.id,
                emailNotifications: true,
                preferredBibleId: null,
              })
              .returning();
            return newSettings;
          }
          return settings;
        }),
      db.query.usersToRoles
        .findMany({
          where: (usersToRoles, { eq }) => eq(usersToRoles.userId, user!.id),
          with: { role: true },
        })
        .then((roles) => roles.map((role) => role.role)),
      db.query.userCredits
        .findFirst({ where: (userCredits, { eq }) => eq(userCredits.userId, user!.id) })
        .then(async (userCredit) => {
          if (userCredit) {
            const twentyFourHoursAfterLastCredit = add(
              userCredit.lastSignInCreditAt ?? new Date(),
              {
                hours: 24,
              },
            );
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
                .where(eq(userCredits.userId, user!.id));
            }
          } else {
            await db.insert(userCredits).values({
              userId: user.id,
              lastSignInCreditAt: new Date(),
            });
          }
        }),
    ]);

    Object.assign(locals, { session, user, roles, settings });
  };
};
