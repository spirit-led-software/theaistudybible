import type { userMessages } from "../../schema";

export type UserMessage = typeof userMessages.$inferSelect;

export type CreateUserMessageData = typeof userMessages.$inferInsert;

export type UpdateUserMessageData = Partial<CreateUserMessageData>;
