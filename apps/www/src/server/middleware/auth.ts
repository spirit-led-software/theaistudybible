import { cache } from '@/core/cache';
import { db } from '@/core/database';
import { userCredits, userSettings } from '@/core/database/schema';
import type { Role } from '@/schemas/roles/types';
import type { UserCredits } from '@/schemas/users/credits/types';
import type { UserSettings } from '@/schemas/users/settings/types';
import type { FetchEvent } from '@solidjs/start/server';
import { sql } from 'drizzle-orm';
import { authenticate } from '../auth';

const ROLES_CACHE_TTL = 60 * 60; // Cache for 1 hour
const SETTINGS_CACHE_TTL = 60 * 60; // Cache for 1 hour
const CREDITS_CACHE_TTL = 30 * 60; // Cache for 30 minutes

export const authMiddleware = () => {
  return async ({ nativeEvent, locals }: FetchEvent) => {
    const { session, user } = await authenticate(nativeEvent);
    if (!session || !user) {
      Object.assign(locals, { session: null, user: null, settings: null, roles: null });
      return;
    }

    const settingsCacheKey = `settings:${user.id}`;
    const rolesCacheKey = `roles:${user.id}`;
    const creditsCacheKey = `credits:${user.id}`;

    // Fetch all cache values concurrently
    let [settings, roles, credits] = await Promise.all([
      cache.get<UserSettings>(settingsCacheKey),
      cache.get<Role[]>(rolesCacheKey),
      cache.get<UserCredits>(creditsCacheKey),
    ]);

    // Prepare concurrent database operations for cache misses
    const dbOperations: Promise<unknown>[] = [];
    const cacheOperations: Promise<unknown>[] = [];

    if (!settings) {
      dbOperations.push(
        db
          .insert(userSettings)
          .values({ userId: user.id, emailNotifications: true, preferredBibleId: null })
          .onConflictDoNothing()
          .returning()
          .then(async ([newSettings]) => {
            settings =
              newSettings ||
              (await db.query.userSettings.findFirst({
                where: (settings, { eq }) => eq(settings.userId, user.id),
              }));
            cacheOperations.push(cache.set(settingsCacheKey, settings, { ex: SETTINGS_CACHE_TTL }));
          }),
      );
    }

    if (!roles) {
      dbOperations.push(
        db.query.usersToRoles
          .findMany({
            where: (usersToRoles, { eq }) => eq(usersToRoles.userId, user.id),
            with: { role: true },
          })
          .then((userRoles) => {
            roles = userRoles.map((role) => role.role);
            cacheOperations.push(cache.set(rolesCacheKey, roles, { ex: ROLES_CACHE_TTL }));
          }),
      );
    }

    if (!credits) {
      dbOperations.push(
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
          .returning()
          .then(([credits]) => {
            cacheOperations.push(cache.set(creditsCacheKey, credits, { ex: CREDITS_CACHE_TTL }));
          }),
      );
    }

    // Wait for all database operations to complete
    if (dbOperations.length > 0) {
      await Promise.all(dbOperations).catch(console.error);
    }

    // Fire and forget cache operations - no need to wait
    if (cacheOperations.length > 0) {
      Promise.all(cacheOperations).catch(console.error);
    }

    Object.assign(locals, { session, user, roles, settings });
  };
};
