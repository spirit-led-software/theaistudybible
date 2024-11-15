import type { Role } from '@/schemas/roles';
import { auth } from '@/www/server/auth';
import { setUser as setSentryUser } from '@sentry/solidstart';
import { GET } from '@solidjs/start';
import { createQuery, useQueryClient } from '@tanstack/solid-query';
import type { Session, User } from 'lucia';
import {
  type Accessor,
  type JSX,
  createContext,
  createEffect,
  createMemo,
  useContext,
} from 'solid-js';
import { isServer } from 'solid-js/web';
import { usePosthog } from './posthog';

export type AuthContextType = {
  session: Accessor<Session | null | undefined>;
  user: Accessor<User | null | undefined>;
  roles: Accessor<Role[] | null | undefined>;
};

export const AuthContext = createContext<AuthContextType>({
  session: () => undefined,
  user: () => undefined,
  roles: () => undefined,
});

export const useAuth = () => {
  const queryClient = useQueryClient();

  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return {
    isLoaded: createMemo(
      () =>
        context.session() !== undefined &&
        context.user() !== undefined &&
        context.roles() !== undefined,
    ),
    isSignedIn: createMemo(() => context.session() !== null && context.user() !== null),
    isAdmin: createMemo(() => context.roles()?.some((role) => role.id === 'admin') ?? false),
    invalidate: () =>
      queryClient.invalidateQueries({ queryKey: authProviderQueryOptions().queryKey }),
    refetch: () => queryClient.refetchQueries({ queryKey: authProviderQueryOptions().queryKey }),
    ...context,
  };
};

const getAuth = GET(() => {
  'use server';
  return auth();
});

export const authProviderQueryOptions = () => ({
  queryKey: ['auth-context'],
  queryFn: () => getAuth(),
});

export type AuthProviderProps = {
  children: JSX.Element;
};

export const AuthProvider = (props: AuthProviderProps) => {
  const posthog = usePosthog();

  const placeholderData = isServer
    ? getAuth()
    : {
        session: undefined,
        user: undefined,
        roles: undefined,
      };

  const query = createQuery(() => ({
    ...authProviderQueryOptions(),
    placeholderData: placeholderData as unknown as ReturnType<typeof getAuth>,
  }));

  const session = createMemo(() => query.data?.session);
  const user = createMemo(() => query.data?.user);
  const roles = createMemo(() => query.data?.roles);

  createEffect(() => {
    const currentUser = user();
    if (currentUser) {
      posthog()?.identify(currentUser.id, { email: currentUser.email });
      setSentryUser({ id: currentUser.id, email: currentUser.email });
    }
  });

  return (
    <AuthContext.Provider value={{ session, user, roles }}>{props.children}</AuthContext.Provider>
  );
};
