import type { PgInsertValue, PgUpdateSetSource } from "drizzle-orm/pg-core";
import type { aiResponseReactions } from "../../schema";

export type AiResponseReaction = typeof aiResponseReactions.$inferSelect;

export type CreateAiResponseReactionData = PgInsertValue<
  typeof aiResponseReactions
>;

export type UpdateAiResponseReactionData = PgUpdateSetSource<
  typeof aiResponseReactions
>;
