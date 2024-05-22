import type { messageReactions, messages } from '@revelationsai/core/database/schema';
import type { PgInsertValue, PgUpdateSetSource } from 'drizzle-orm/pg-core';

export type Message = typeof messages.$inferSelect;
export type CreateMessageData = PgInsertValue<typeof messages>;
export type UpdateMessageData = PgUpdateSetSource<typeof messages>;

export type MessageReaction = typeof messageReactions.$inferSelect;
export type CreateMessageReactionData = PgInsertValue<typeof messageReactions>;
export type UpdateMessageReactionData = PgUpdateSetSource<typeof messageReactions>;
