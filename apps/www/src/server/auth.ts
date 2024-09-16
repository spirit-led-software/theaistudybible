import { getRequestEvent } from 'solid-js/web';

export function auth() {
  'use server';
  const event = getRequestEvent()!;
  return {
    session: event.locals.session,
    user: event.locals.user,
    roles: event.locals.roles,
  };
}
