import type { Role } from '@/schemas/roles';
import { createQuery } from '@tanstack/solid-query';
import type { Session, User } from 'lucia';
import { type Accessor, type JSX, createContext, useContext } from 'solid-js';
import { auth } from '../server/auth';

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
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return {
    isLoaded: () =>
      context.session() !== undefined &&
      context.user() !== undefined &&
      context.roles() !== undefined,
    isSignedIn: () => context.session() !== null && context.user() !== null,
    isAdmin: () => context.roles()?.some((role) => role.id === 'admin'),
    ...context,
  };
};

export const authProviderQueryOptions = {
  queryKey: ['auth-context'],
  queryFn: () => auth(),
};

export type AuthProviderProps = {
  children: JSX.Element;
};

export const AuthProvider = (props: AuthProviderProps) => {
  const query = createQuery(() => authProviderQueryOptions);

  return (
    <AuthContext.Provider
      value={{
        session: () => query.data?.session,
        user: () => query.data?.user,
        roles: () => query.data?.roles,
      }}
    >
      {props.children}
    </AuthContext.Provider>
  );
};
