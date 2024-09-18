import { type Config, defineConfig } from 'drizzle-kit';
import { Resource } from 'sst';

const config: Config = {
  schema: 'packages/core/src/database/schema.ts',
  out: 'migrations',
  dialect: 'sqlite',
  dbCredentials: {
    url: Resource.Database.url,
    authToken: Resource.Database.token || undefined,
  },
};

if (!Resource.Database.url.startsWith('file:')) {
  // @ts-expect-error - Something with drizzle-kit is not allowing driver to be set after the config is defined
  config.driver = 'turso';
}

export default defineConfig(config);
