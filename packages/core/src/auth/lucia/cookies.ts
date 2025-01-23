import type { Session } from '@/schemas/users/types';
import { type SerializeOptions, serialize } from 'cookie';
import { Resource } from 'sst';

export class SessionCookie {
  constructor(
    public name: string,
    public value: string,
    public attributes: SerializeOptions,
  ) {}

  serialize() {
    return serialize(this.name, this.value, this.attributes);
  }
}

export const sessionCookieName = 'auth_session';

export function createSessionCookie(token: string, session: Session): SessionCookie {
  return new SessionCookie(sessionCookieName, token, {
    path: '/',
    expires: session.expiresAt,
    sameSite: 'lax',
    httpOnly: true,
    secure: Resource.Dev.value !== 'true',
  });
}

export function createBlankSessionCookie(): SessionCookie {
  return new SessionCookie(sessionCookieName, '', {
    path: '/',
    maxAge: 0,
    sameSite: 'lax',
    httpOnly: true,
    secure: Resource.Dev.value !== 'true',
  });
}
