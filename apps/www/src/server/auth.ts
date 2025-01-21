import { lucia } from '@/core/auth';
import { cache } from '@/core/cache';
import type { Role } from '@/schemas/roles/types';
import type { Session, User, UserSettings } from '@/schemas/users/types';
import { getRequestEvent } from 'solid-js/web';
import { type HTTPEvent, setCookie } from 'vinxi/http';
import { getCookie } from 'vinxi/http';

export const AUTH_CACHE_TTL = 60; // Cache for 1 minute

export const authenticate = async (event: HTTPEvent) => {
  const sessionToken = getCookie(event, lucia.cookies.sessionCookieName) ?? null;
  if (!sessionToken) return { session: null, user: null };

  const cacheKey = `auth:${sessionToken}`;
  const cached = await cache.get(cacheKey);
  if (cached) {
    console.log(`Session cache hit: ${sessionToken}`);
    return cached as { session: Session | null; user: User | null };
  }
  console.log(`Session cache miss: ${sessionToken}`);

  const { session, user } = await lucia.sessions.validateSessionToken(sessionToken);

  if (!session || !user) {
    const cookie = lucia.cookies.createBlankSessionCookie();
    setCookie(event, cookie.name, cookie.value, cookie.attributes);
    return { session: null, user: null };
  }

  const result = { session, user };
  await cache.set(cacheKey, result, { ex: AUTH_CACHE_TTL });
  return result;
};

export const auth = () => {
  const event = getRequestEvent();
  if (!event) throw new Error('No event found');

  return {
    session: event.locals.session,
    user: event.locals.user,
    settings: event.locals.settings,
    roles: event.locals.roles,
  };
};

export const requireAuth = (message?: string) => {
  const authObj = auth();
  if (!authObj.session || !authObj.user) {
    throw new Error(message || 'You must be signed in to access this resource');
  }

  return authObj as {
    session: Session;
    user: User;
    settings: UserSettings;
    roles: Role[];
  };
};

export const requireAdmin = () => {
  const authObj = requireAuth();
  if (!authObj.roles.some((role) => role.name === 'admin')) {
    throw new Error('You must be an admin to access this resource');
  }
  return authObj;
};
