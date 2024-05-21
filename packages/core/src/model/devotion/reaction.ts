import type { PgInsertValue, PgUpdateSetSource } from 'drizzle-orm/pg-core';
import { devotionReactions } from '../../database/schema';

export type DevotionReaction = typeof devotionReactions.$inferSelect;
export type CreateDevotionReactionData = PgInsertValue<typeof devotionReactions>;
export type UpdateDevotionReactionData = PgUpdateSetSource<typeof devotionReactions>;
