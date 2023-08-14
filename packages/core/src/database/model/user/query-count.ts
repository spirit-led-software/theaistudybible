import { InferModel } from "drizzle-orm";
import { PgUpdateSetSource } from "drizzle-orm/pg-core";
import { userQueryCounts } from "../../schema";

export type UserQueryCount = InferModel<typeof userQueryCounts, "select">;

export type CreateUserQueryCountData = InferModel<
  typeof userQueryCounts,
  "insert"
>;

export type UpdateUserQueryCountData = PgUpdateSetSource<
  typeof userQueryCounts
>;
