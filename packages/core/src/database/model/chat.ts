import { InferModel } from "drizzle-orm";
import { PgUpdateSetSource } from "drizzle-orm/pg-core";
import { chats } from "../schema";

export type Chat = InferModel<typeof chats, "select">;

export type CreateChatData = InferModel<typeof chats, "insert">;

export type UpdateChatData = PgUpdateSetSource<typeof chats>;
