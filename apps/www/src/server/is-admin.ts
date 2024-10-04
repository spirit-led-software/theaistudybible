'use server';

import { withAuth } from './auth';

export const isAdmin = withAuth(({ roles }) => {
  return roles?.some((role) => role.id === 'admin') ?? false;
});
