import '../../sst-env';
import type { lucia } from '@/core/auth';
import type { users } from '@/core/database/schema';

declare module 'lucia' {
  interface Register {
    Lucia: typeof lucia;
    DatabaseUserAttributes: typeof users.$inferSelect;
  }
}
