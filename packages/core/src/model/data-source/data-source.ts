import type { PgInsertValue, PgUpdateSetSource } from 'drizzle-orm/pg-core';
import type { dataSources } from '../../database/schema';

export type DataSource = typeof dataSources.$inferSelect;
export type CreateDataSourceData = PgInsertValue<typeof dataSources>;
export type UpdateDataSourceData = PgUpdateSetSource<typeof dataSources>;
