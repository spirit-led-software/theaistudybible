import type { JwtPayload } from '@clerk/types';

export function checkRole(role: string, sessionClaims?: JwtPayload | null) {
  if (
    !sessionClaims ||
    !sessionClaims.metadata.roles ||
    !Array.isArray(sessionClaims.metadata.roles)
  ) {
    return false;
  }
  return sessionClaims.metadata.roles.some((r) => r === role);
}
