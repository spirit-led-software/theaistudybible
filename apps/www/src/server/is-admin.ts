import { auth } from './auth';

export function isAdmin() {
  'use server';
  const { roles } = auth();
  return roles?.some((role) => role.id === 'admin') ?? false;
}
