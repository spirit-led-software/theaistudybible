import { setUser as setSentryUser } from '@sentry/solidstart';
import { GET } from '@solidjs/start';
import { createQuery, isServer } from '@tanstack/solid-query';
import { createMemo } from 'solid-js';
import { createEffect } from 'solid-js';
import { usePosthog } from '../contexts/posthog';
import { auth } from '../server/utils/auth';

const getAuth = GET(() => {
  'use server';
  return { auth: auth() };
});

export const useAuth = () => {
  const posthog = usePosthog();

  const placeholderData = isServer
    ? getAuth()
    : { auth: { session: undefined, user: undefined, settings: undefined, roles: undefined } };

  const query = createQuery(() => ({
    queryKey: ['auth'],
    queryFn: () => getAuth(),
    placeholderData: placeholderData as ReturnType<typeof getAuth>,
    staleTime: 1000 * 60 * 5,
  }));

  const session = createMemo(() => query.data?.auth.session);
  const user = createMemo(() => query.data?.auth.user);
  const roles = createMemo(() => query.data?.auth.roles);
  const settings = createMemo(() => query.data?.auth.settings);

  createEffect(() => {
    const currentUser = user();
    if (currentUser) {
      posthog()?.identify(currentUser.id, { email: currentUser.email });
      setSentryUser({ id: currentUser.id, email: currentUser.email });
    }
  });

  return {
    session,
    user,
    roles,
    settings,
    isLoaded: createMemo(
      () =>
        session() !== undefined &&
        user() !== undefined &&
        settings() !== undefined &&
        roles() !== undefined,
    ),
    isSignedIn: createMemo(() => session() !== null && user() !== null),
    isAdmin: createMemo(() => roles()?.some((role) => role.id === 'admin') ?? false),
    refetch: query.refetch,
  };
};
