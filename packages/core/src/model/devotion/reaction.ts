import type { PgInsertValue, PgUpdateSetSource } from 'drizzle-orm/pg-core';
import type { devotionReactions } from '../../database/schema';
import type { User } from '../user';
import type { Devotion } from './devotion';

export type DevotionReaction = typeof devotionReactions.$inferSelect;

export type CreateDevotionReactionData = PgInsertValue<typeof devotionReactions>;

export type UpdateDevotionReactionData = PgUpdateSetSource<typeof devotionReactions>;

export type DevotionReactionInfo = DevotionReaction & {
  user: Omit<User, 'passwordHash'>;
  devotion: Devotion;
};
