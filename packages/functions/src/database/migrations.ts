import { neon } from '@neondatabase/serverless';
import databaseConfig from '@revelationsai/core/configs/database';
import * as schema from '@revelationsai/core/database/schema';
import type { Handler } from 'aws-lambda';
import { drizzle } from 'drizzle-orm/neon-http';
import { migrate } from 'drizzle-orm/neon-http/migrator';

export const handler: Handler = async () => {
  try {
    console.log('Creating database migration client using url: ', databaseConfig.readWriteUrl);

    const migrationClient = drizzle(neon(databaseConfig.readWriteUrl), {
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
