import { auth } from 'clerk-solidjs/server';

export function isAdmin() {
  'use server';
  const { sessionClaims } = auth();
  return sessionClaims?.metadata.roles?.includes('admin') ?? false;
}
