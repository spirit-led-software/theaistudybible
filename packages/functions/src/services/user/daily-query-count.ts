import {
  CreateUserDailyQueryCountData,
  UpdateUserDailyQueryCountData,
} from "@core/model";
import { userDailyQueryCounts } from "@core/schema";
import {
  readOnlyDatabase,
  readWriteDatabase,
} from "@revelationsai/core/database";
import { SQL, and, desc, eq } from "drizzle-orm";

export async function getUserDailyQueryCounts(
  options: {
    where?: SQL<unknown>;
    limit?: number;
    offset?: number;
    orderBy?: SQL<unknown>;
  } = {}
) {
  const {
    where,
    limit = 25,
    offset = 0,
    orderBy = desc(userDailyQueryCounts.createdAt),
  } = options;

  return await readOnlyDatabase
    .select()
    .from(userDailyQueryCounts)
    .where(where)
    .limit(limit)
    .offset(offset)
    .orderBy(orderBy);
}

export async function getUserDailyQueryCountsByUserId(
  userId: string,
  options: {
    where?: SQL<unknown>;
    limit?: number;
    offset?: number;
    orderBy?: SQL<unknown>;
  } = {}
) {
  const {
    where,
    limit = 25,
    offset = 0,
    orderBy = desc(userDailyQueryCounts.createdAt),
  } = options;

  return await readOnlyDatabase
    .select()
    .from(userDailyQueryCounts)
    .where(and(eq(userDailyQueryCounts.userId, userId), where))
    .limit(limit)
    .offset(offset)
    .orderBy(orderBy);
}

export async function getUserDailyQueryCountByUserIdAndDate(
  userId: string,
  date: Date
) {
  return (
    await readOnlyDatabase
      .select()
      .from(userDailyQueryCounts)
      .where(
        and(
          eq(userDailyQueryCounts.userId, userId),
          eq(userDailyQueryCounts.date, date)
        )
      )
  ).at(0);
}

export async function createUserDailyQueryCount(
  data: CreateUserDailyQueryCountData
) {
  return (
    await readWriteDatabase
      .insert(userDailyQueryCounts)
      .values(data)
      .returning()
  )[0];
}

export async function updateUserDailyQueryCount(
  id: string,
  data: UpdateUserDailyQueryCountData
) {
  return (
    await readWriteDatabase
      .update(userDailyQueryCounts)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(userDailyQueryCounts.id, id))
      .returning()
  )[0];
}

export async function deleteUserDailyQueryCount(id: string) {
  return (
    await readWriteDatabase
      .delete(userDailyQueryCounts)
      .where(eq(userDailyQueryCounts.id, id))
      .returning()
  )[0];
}
