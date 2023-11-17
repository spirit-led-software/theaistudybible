import type { PgInsertValue, PgUpdateSetSource } from "drizzle-orm/pg-core";
import type { userMessages } from "../../schema";

export type UserMessage = typeof userMessages.$inferSelect;

export type CreateUserMessageData = PgInsertValue<typeof userMessages>;

export type UpdateUserMessageData = PgUpdateSetSource<typeof userMessages>;
