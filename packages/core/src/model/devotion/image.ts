import type { PgInsertValue, PgUpdateSetSource } from 'drizzle-orm/pg-core';
import type { devotionImages } from '../../database/schema';

export type DevotionImage = typeof devotionImages.$inferSelect;

export type CreateDevotionImageData = PgInsertValue<typeof devotionImages>;

export type UpdateDevotionImageData = PgUpdateSetSource<typeof devotionImages>;
