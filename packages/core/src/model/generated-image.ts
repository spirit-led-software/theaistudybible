import type { PgInsertValue, PgUpdateSetSource } from 'drizzle-orm/pg-core';
import type { userGeneratedImages } from '../database/schema';

export type UserGeneratedImage = typeof userGeneratedImages.$inferSelect;
export type CreateUserGeneratedImageData = PgInsertValue<typeof userGeneratedImages>;
export type UpdateUserGeneratedImageData = PgUpdateSetSource<typeof userGeneratedImages>;
