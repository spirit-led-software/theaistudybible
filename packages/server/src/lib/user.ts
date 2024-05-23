import { createClerkClient, type User } from '@clerk/clerk-sdk-node';
import type { JwtPayload } from '@clerk/types';
import { db } from '@lib/server/database';

export const clerkClient = createClerkClient({
  secretKey: process.env.CLERK_SECRET_KEY,
  publishableKey: process.env.PUBLIC_CLERK_PUBLISHABLE_KEY
});

export function hasRole(role: string, sessionClaims: JwtPayload) {
  if (
    !sessionClaims ||
    !sessionClaims.metadata.roles ||
    !Array.isArray(sessionClaims.metadata.roles)
  ) {
    return false;
  }
  return sessionClaims.metadata.roles.some((r) => r === role);
}

export function userHasRole(role: string, user: User) {
  if (!user.publicMetadata.roles || !Array.isArray(user.publicMetadata.roles)) {
    return false;
  }
  return user.publicMetadata.roles.some((r) => r === role);
}

export async function getMaxQueryCountForUser(sessionClaims: JwtPayload) {
  if (
    !sessionClaims ||
    !sessionClaims.metadata.roles ||
    !Array.isArray(sessionClaims.metadata.roles)
  ) {
    return 5;
  }

  const userRoles = sessionClaims.metadata.roles;
  const dbRoles = await db.query.roles.findMany({
    where: (roles, ops) => ops.inArray(roles.id, userRoles)
  });
  return dbRoles.reduce((acc, role) => {
    const queryCount = parseInt(
      role.permissions.find((perm) => perm.startsWith('query:'))?.split(':')[1] ?? '0'
    );
    return Math.max(acc, queryCount);
  }, 0);
}
