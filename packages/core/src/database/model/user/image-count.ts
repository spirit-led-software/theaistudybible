import type { PgInsertValue, PgUpdateSetSource } from 'drizzle-orm/pg-core';
import type { userGeneratedImageCounts } from '../../schema';

export type UserGeneratedImageCount = typeof userGeneratedImageCounts.$inferSelect;

export type CreateUserGeneratedImageCountData = PgInsertValue<typeof userGeneratedImageCounts>;

export type UpdateUserGeneratedImageCountData = PgUpdateSetSource<typeof userGeneratedImageCounts>;
