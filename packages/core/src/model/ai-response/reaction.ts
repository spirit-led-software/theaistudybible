import type { PgInsertValue, PgUpdateSetSource } from 'drizzle-orm/pg-core';
import { createInsertSchema } from 'drizzle-zod';
import { z } from 'zod';
import { aiResponseReactions } from '../../database/schema';
import type { User } from '../user';
import type { AiResponse } from './ai-response';

export type AiResponseReaction = typeof aiResponseReactions.$inferSelect;

export type CreateAiResponseReactionData = PgInsertValue<typeof aiResponseReactions>;
export const createAiResponseReactionSchema = createInsertSchema(aiResponseReactions, {
  id: z.undefined(),
  createdAt: z.undefined(),
  updatedAt: z.undefined(),
  reaction: z.enum(aiResponseReactions.reaction.enumValues),
  comment: z.string().min(1).max(1000),
  userId: z.string().uuid(),
  aiResponseId: z.string().uuid()
});
export type CreateAiResponseReactionInput = z.input<typeof createAiResponseReactionSchema>;

export type UpdateAiResponseReactionData = PgUpdateSetSource<typeof aiResponseReactions>;
export const updateAiResponseReactionSchema = createInsertSchema(aiResponseReactions, {
  id: z.undefined(),
  createdAt: z.undefined(),
  updatedAt: z.undefined(),
  reaction: z
    .enum(aiResponseReactions.reaction.enumValues)
    .nullish()
    .transform((val) => val || undefined),
  comment: z.string().min(1).max(1000),
  userId: z.undefined(),
  aiResponseId: z.undefined()
});
export type UpdateAiResponseReactionInput = z.input<typeof updateAiResponseReactionSchema>;

export type AiResponseReactionInfo = AiResponseReaction & {
  user: Omit<User, 'passwordHash'>;
  response: AiResponse;
};
