import { InferModel } from "drizzle-orm";
import { PgUpdateSetSource } from "drizzle-orm/pg-core";
import { userMessages } from "../schema";

export type UserMessage = InferModel<typeof userMessages, "select">;

export type CreateUserMessageData = InferModel<typeof userMessages, "insert">;

export type UpdateUserMessageData = PgUpdateSetSource<typeof userMessages>;
