import { defineConfig } from 'drizzle-kit';
import { Resource } from 'sst';

export default defineConfig({
  schema: 'packages/core/src/database/schema.ts',
  out: 'migrations',
  dialect: 'turso',
  dbCredentials: {
    url: Resource.TursoDatabaseSchema.url,
    authToken: Resource.TursoDatabaseSchema.token || undefined,
  },
});
