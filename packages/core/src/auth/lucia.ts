import { db } from '@/core/database';
import { sessions, users } from '@/core/database/schema';
import { DrizzleSQLiteAdapter } from '@lucia-auth/adapter-drizzle';
import { Lucia } from 'lucia';
import { Resource } from 'sst';

export const lucia = new Lucia(new DrizzleSQLiteAdapter(db, sessions, users), {
  sessionCookie: {
    expires: false,
    attributes: {
      domain: Resource.Dev.value === 'true' ? undefined : `.${Resource.Domain.value}`,
      path: '/',
      sameSite: Resource.Dev.value === 'true' ? 'lax' : 'none',
      secure: true,
    },
  },
  getUserAttributes: (attributes) => ({
    ...attributes,
  }),
});
