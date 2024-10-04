import { getRequestEvent } from 'solid-js/web';
import { serverFn } from './server-fn';

export const auth = serverFn(() => {
  const event = getRequestEvent();
  if (!event) {
    throw new Error('No event found');
  }
  return {
    session: event.locals.session,
    user: event.locals.user,
    roles: event.locals.roles,
  };
});
