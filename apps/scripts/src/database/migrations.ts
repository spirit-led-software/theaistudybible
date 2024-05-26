import { neon } from '@neondatabase/serverless';
import * as schema from '@theaistudybible/core/database/schema';
import { drizzle } from 'drizzle-orm/neon-http';
import { migrate } from 'drizzle-orm/neon-http/migrator';
import path from 'path';

export async function migrations({
  dbUrl,
  migrationsDir
}: {
  dbUrl: string;
  migrationsDir: string;
}) {
  const migrationClient = drizzle(neon(dbUrl), {
    schema,
    logger: {
      logQuery(query, params) {
        console.log('Executing query:', query, params);
      }
    }
  });

  console.log('Running database migrations...');
  await migrate(migrationClient, {
    migrationsFolder: path.resolve(migrationsDir)
  });
  console.log('Database migrations complete!');
}
