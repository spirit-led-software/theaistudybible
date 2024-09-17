import { db } from '@/core/database';
import { sessions, users } from '@/core/database/schema';
import { DrizzleSQLiteAdapter } from '@lucia-auth/adapter-drizzle';
import { Lucia } from 'lucia';

export const lucia = new Lucia(new DrizzleSQLiteAdapter(db, sessions, users), {
  sessionCookie: {
    expires: false,
  },
  getUserAttributes: (attributes) => ({
    ...attributes,
  }),
});
