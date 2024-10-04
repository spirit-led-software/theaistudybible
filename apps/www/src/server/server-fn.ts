import type { Role } from '@/schemas/roles';
import type { Session, User } from 'lucia';
import { auth } from './auth';

export type AuthObject = {
  user: User | null;
  session: Session | null;
  roles: Role[] | null;
};

export type SignedInAuthObject = {
  user: User;
  session: Session;
  roles: Role[];
};

// biome-ignore lint/suspicious/noExplicitAny: We need to allow any arguments to be passed to the function
export const serverFn = <T extends (...args: any[]) => any>(fn: T) => {
  'use server';
  return fn;
};

// biome-ignore lint/suspicious/noExplicitAny: We need to allow any arguments to be passed to the function
export const serverFnWithAuth = <T extends (auth: AuthObject, ...args: any[]) => any>(fn: T) => {
  'use server';
  const authObject = auth();
  return (
    ...args: Parameters<T> extends [AuthObject, ...infer Rest] ? Rest : never[]
  ): ReturnType<T> => fn(authObject, ...args);
};

// biome-ignore lint/suspicious/noExplicitAny: We need to allow any arguments to be passed to the function
export const serverFnRequiresAuth = <T extends (auth: SignedInAuthObject, ...args: any[]) => any>(
  fn: T,
) => {
  'use server';
  const authObject = auth();
  if (!authObject.session || !authObject.user) {
    throw new Error('User is not authenticated');
  }
  return (
    ...args: Parameters<T> extends [SignedInAuthObject, ...infer Rest] ? Rest : never[]
  ): ReturnType<T> => fn(authObject as SignedInAuthObject, ...args);
};

// biome-ignore lint/suspicious/noExplicitAny: We need to allow any arguments to be passed to the function
export const serverFnRequiresRole = <T extends (auth: SignedInAuthObject, ...args: any[]) => any>(
  role: string,
  fn: T,
) => {
  'use server';
  const authObject = auth();
  if (!authObject.session || !authObject.user) {
    throw new Error('User is not authenticated');
  }
  if (!authObject.roles?.some((r) => r.id === role || r.name === role)) {
    throw new Error('User does not have the required role');
  }
  return (
    ...args: Parameters<T> extends [SignedInAuthObject, ...infer Rest] ? Rest : never[]
  ): ReturnType<T> => fn(authObject as SignedInAuthObject, ...args);
};
