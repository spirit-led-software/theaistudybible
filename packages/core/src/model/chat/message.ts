import type { messages } from '@revelationsai/core/database/schema';
import type { PgInsertValue, PgUpdateSetSource } from 'drizzle-orm/pg-core';

export type Message = typeof messages.$inferSelect;
export type CreateMessageData = PgInsertValue<typeof messages>;
export type UpdateMessageData = PgUpdateSetSource<typeof messages>;
