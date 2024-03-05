import { building } from '$app/environment';
import { RAIDatabaseConfig } from '@revelationsai/server/lib/database/config';
import { withReplicas } from 'drizzle-orm/pg-core';
import { Config } from 'sst/node/config';

export let readWriteDatabaseConfig: RAIDatabaseConfig;
if (!building) {
	readWriteDatabaseConfig = new RAIDatabaseConfig({
		connectionString: Config.DATABASE_READWRITE_URL,
		readOnly: false
	});
}

function getDatabase() {
	if (Config.DATABASE_READWRITE_URL !== Config.DATABASE_READONLY_URL) {
		const readOnlyDatabaseConfig = new RAIDatabaseConfig({
			connectionString: Config.DATABASE_READONLY_URL,
			readOnly: true
		});
		return withReplicas(readWriteDatabaseConfig.database, [readOnlyDatabaseConfig.database]);
	}
	return readWriteDatabaseConfig.database;
}

export let db: ReturnType<typeof getDatabase>;
if (!building) {
	db = getDatabase();
}
