import type { Role } from '@/schemas/roles/types';
import type { UserSettings } from '@/schemas/users/types';
import type { Session, User } from 'lucia';
import { getRequestEvent } from 'solid-js/web';

export const auth = () => {
  const event = getRequestEvent();
  if (!event) {
    throw new Error('No event found');
  }
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
