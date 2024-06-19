import * as schema from '@theaistudybible/core/database/schema';
import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import path from 'path';
import { Pool } from 'pg';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function runDatabaseMigrations() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 1
  });
  const migrationClient = drizzle(pool, {
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
