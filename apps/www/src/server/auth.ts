import { lucia } from '@/core/auth';
import { cache } from '@/core/cache';
import type { Role } from '@/schemas/roles/types';
import type { UserSettings } from '@/schemas/users/types';
import type { Session, User } from 'lucia';
import { getRequestEvent } from 'solid-js/web';
import { type HTTPEvent, setCookie } from 'vinxi/http';
import { getCookie } from 'vinxi/http';

export const AUTH_CACHE_TTL = 60; // Cache for 1 minute

export const authenticate = async (event: HTTPEvent) => {
  const sessionId = getCookie(event, lucia.sessionCookieName) ?? null;
  if (!sessionId) {
    return { session: null, user: null };
  }

  const cacheKey = `auth:${sessionId}`;
  const cached = await cache.get(cacheKey);
  if (cached) {
    console.log(`Session cache hit: ${sessionId}`);
    return cached as { session: Session | null; user: User | null };
  }
  console.log(`Session cache miss: ${sessionId}`);

  const { session, user } = await lucia.validateSession(sessionId);

  if (session?.fresh) {
    console.log(`Refreshing session for user: ${session.userId}`);
    const cookie = lucia.createSessionCookie(session.id);
    setCookie(event, cookie.name, cookie.value, cookie.attributes);
  }

  if (!session || !user) {
    const cookie = lucia.createBlankSessionCookie();
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
  if (!authObj.session || !authObj.user)
    throw new Error(message || 'You must be signed in to access this resource');

  return authObj as {
    session: Session;
    user: User;
    settings: UserSettings;
    roles: Role[];
  };
};
