class SessionCookie {
  constructor(
    public name: string,
    public value: string,
    public attributes: {
      path: string;
      maxAge: number;
      sameSite: 'lax' | 'strict' | 'none';
      httpOnly: boolean;
      secure: boolean;
    },
  ) {}

  serialize() {
    return `${this.name}=${this.value}; ${Object.entries(this.attributes)
      .map(([key, value]) => `${key}=${value}`)
      .join('; ')}`;
  }
}

export const sessionCookieName = 'auth_session';

export function createSessionCookie(sessionToken: string): SessionCookie {
  return new SessionCookie(sessionCookieName, sessionToken, {
    path: '/',
    maxAge: 0,
    sameSite: 'lax',
    httpOnly: true,
    secure: true,
  });
}

export function createBlankSessionCookie(): SessionCookie {
  return new SessionCookie(sessionCookieName, '', {
    path: '/',
    maxAge: 0,
    sameSite: 'lax',
    httpOnly: true,
    secure: true,
  });
}
