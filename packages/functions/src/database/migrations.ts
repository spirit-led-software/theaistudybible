import { neon } from '@neondatabase/serverless';
import * as schema from '@revelationsai/core/database/schema';
import type { Handler } from 'aws-lambda';
import { drizzle } from 'drizzle-orm/neon-http';
import { migrate } from 'drizzle-orm/neon-http/migrator';
import { Config } from 'sst/node/config';

export const handler: Handler = async () => {
  try {
    console.log('Creating database migration client using url: ', Config.DATABASE_READWRITE_URL);

    const migrationClient = drizzle(neon(Config.DATABASE_READWRITE_URL), {
      schema,
      logger: {
        logQuery(query, params) {
          console.log('Executing query:', query, params);
        }
      }
    });

    console.log('Running database migrations...');
    await migrate(migrationClient, {
      migrationsFolder: 'migrations'
    });
    console.log('Database migrations complete!');
  } catch (e) {
    console.log(e);
    throw e;
  }
};
