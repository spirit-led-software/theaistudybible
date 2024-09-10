import type { User } from '@clerk/clerk-sdk-node';
import type { JwtPayload } from '@clerk/types';

export function hasRole(role: string, sessionClaims?: JwtPayload | null) {
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
