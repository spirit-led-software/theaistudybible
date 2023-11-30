import type { PgInsertValue, PgUpdateSetSource } from 'drizzle-orm/pg-core';
import type { aiResponseReactions } from '../../schema';
import type { User } from '../user';
import type { AiResponse } from './ai-response';

export type AiResponseReaction = typeof aiResponseReactions.$inferSelect;

export type CreateAiResponseReactionData = PgInsertValue<typeof aiResponseReactions>;

export type UpdateAiResponseReactionData = PgUpdateSetSource<typeof aiResponseReactions>;

export type AiResponseReactionInfo = AiResponseReaction & {
  user: User;
  response: AiResponse;
};
