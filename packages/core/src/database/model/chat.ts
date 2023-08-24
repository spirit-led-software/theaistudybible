import { chats } from "../schema";

export type Chat = typeof chats.$inferSelect;

export type CreateChatData = typeof chats.$inferInsert;

export type UpdateChatData = Partial<CreateChatData>;
