import type { PgInsertValue, PgUpdateSetSource } from 'drizzle-orm/pg-core';
import { devotions } from '../../database/schema';

export type Devotion = typeof devotions.$inferSelect;
export type CreateDevotionData = PgInsertValue<typeof devotions>;
export type UpdateDevotionData = PgUpdateSetSource<typeof devotions>;
