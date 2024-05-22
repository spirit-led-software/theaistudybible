import { createClerkClient, type User } from '@clerk/clerk-sdk-node';
import { db } from '@revelationsai/server/lib/database';

export const clerkClient = createClerkClient({
  secretKey: process.env.CLERK_SECRET_KEY,
  publishableKey: process.env.PUBLIC_CLERK_PUBLISHABLE_KEY
});

export function hasRole(role: string, user: User): boolean {
  if (!user.publicMetadata.roles || !Array.isArray(user.publicMetadata.roles)) {
    return false;
  }
  return user.publicMetadata.roles.includes(role) ?? false;
}

export async function getMaxQueryCountForUser(user: User) {
  if (!user.publicMetadata.roles || !Array.isArray(user.publicMetadata.roles)) {
    return 5;
  }

  const userRoles = user.publicMetadata.roles;
  const dbRoles = await db.query.roles.findMany({
    where: (roles, ops) => ops.inArray(roles.id, userRoles)
  });
  const maxCount = dbRoles.reduce((acc, role) => {
    const queryCount = parseInt(
      role.permissions.find((perm) => perm.startsWith('query:'))?.split(':')[1] ?? '0'
    );
    return Math.max(acc, queryCount);
  }, 0);

  return maxCount;
}
