import { lucia } from '@/core/auth';
import { getCookie, setCookie } from '@tanstack/react-start/server';

export const authenticate = async () => {
  const sessionToken = getCookie(lucia.cookies.sessionCookieName) ?? null;
  if (!sessionToken) return { session: null, user: null };

  const { session, user } = await lucia.sessions.validateSessionToken(sessionToken);
  if (!session || !user) {
    const cookie = lucia.cookies.createBlankSessionCookie();
    setCookie(cookie.name, cookie.value, cookie.attributes);
    return { session: null, user: null };
  }

  return { session, user };
};
