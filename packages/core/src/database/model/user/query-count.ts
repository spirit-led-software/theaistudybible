import type { PgInsertValue, PgUpdateSetSource } from 'drizzle-orm/pg-core';
import type { userQueryCounts } from '../../schema';

export type UserQueryCount = typeof userQueryCounts.$inferSelect;

export type CreateUserQueryCountData = PgInsertValue<typeof userQueryCounts>;

export type UpdateUserQueryCountData = PgUpdateSetSource<typeof userQueryCounts>;
