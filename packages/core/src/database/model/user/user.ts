import { InferModel } from "drizzle-orm";
import { PgUpdateSetSource } from "drizzle-orm/pg-core";
import { users } from "../../schema";

export type User = InferModel<typeof users, "select">;

export type CreateUserData = InferModel<typeof users, "insert">;

export type UpdateUserData = PgUpdateSetSource<typeof users>;
