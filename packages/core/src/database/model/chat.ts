import type { PgInsertValue, PgUpdateSetSource } from "drizzle-orm/pg-core";
import type { chats } from "../schema";

export type Chat = typeof chats.$inferSelect;

export type CreateChatData = PgInsertValue<typeof chats>;

export type UpdateChatData = PgUpdateSetSource<typeof chats>;
