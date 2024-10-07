import { serverFnWithAuth } from './server-fn';

export const isAdmin = serverFnWithAuth(({ roles }) => {
  return roles?.some((role) => role.id === 'admin') ?? false;
});
