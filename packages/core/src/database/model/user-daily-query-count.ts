import { InferModel } from "drizzle-orm";
import { PgUpdateSetSource } from "drizzle-orm/pg-core";
import { userDailyQueryCounts } from "../schema";

export type UserDailyQueryCount = InferModel<
  typeof userDailyQueryCounts,
  "select"
>;

export type CreateUserDailyQueryCountData = InferModel<
  typeof userDailyQueryCounts,
  "insert"
>;

export type UpdateUserDailyQueryCountData = PgUpdateSetSource<
  typeof userDailyQueryCounts
>;
