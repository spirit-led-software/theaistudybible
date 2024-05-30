import { neon } from '@neondatabase/serverless';
import * as schema from '@theaistudybible/core/database/schema';
import { drizzle } from 'drizzle-orm/neon-http';
import { migrate } from 'drizzle-orm/neon-http/migrator';
import path from 'path';
import { Resource } from 'sst';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function runDatabaseMigrations() {
  const migrationClient = drizzle(neon(Resource.NeonBranch.readWriteUrl), {
    schema,
    logger: {
      logQuery(query, params) {
        console.log('Executing query:', query, params);
      }
    }
  });

  console.log('Running database migrations...');
  await migrate(migrationClient, {
    migrationsFolder: path.resolve(__dirname, '../../../../migrations')
  });
  console.log('Database migrations complete!');
}
