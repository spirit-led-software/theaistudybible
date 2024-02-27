import type { PgInsertValue, PgUpdateSetSource } from 'drizzle-orm/pg-core';
import { createInsertSchema } from 'drizzle-zod';
import { z } from 'zod';
import { devotionReactions } from '../../database/schema';
import type { User } from '../user';
import type { Devotion } from './devotion';

export type DevotionReaction = typeof devotionReactions.$inferSelect;

export type CreateDevotionReactionData = PgInsertValue<typeof devotionReactions>;
export const createDevotionReactionSchema = createInsertSchema(devotionReactions, {
  id: z.undefined(),
  createdAt: z.undefined(),
  updatedAt: z.undefined(),
  comment: z
    .string()
    .min(1)
    .max(255)
    .transform((val) => val.trim())
    .nullish()
    .transform((val) => val || undefined),
  userId: z.string().uuid(),
  devotionId: z.string().uuid()
});
export type CreateDevotionReactionInput = z.input<typeof createDevotionReactionSchema>;

export type UpdateDevotionReactionData = PgUpdateSetSource<typeof devotionReactions>;
export const updateDevotionReactionSchema = z.object({
  id: z.undefined(),
  createdAt: z.undefined(),
  updatedAt: z.undefined(),
  reaction: z
    .enum(devotionReactions.reaction.enumValues)
    .nullish()
    .transform((val) => val || undefined),
  comment: z
    .string()
    .min(1)
    .max(255)
    .transform((val) => val.trim())
    .nullish()
    .transform((val) => val || undefined),
  userId: z.undefined(),
  devotionId: z.undefined()
});
export type UpdateDevotionReactionInput = z.input<typeof updateDevotionReactionSchema>;

export type DevotionReactionInfo = DevotionReaction & {
  user: Omit<User, 'passwordHash'>;
  devotion: Devotion;
};
