import { and, eq } from "drizzle-orm";
import { readOnlyDatabase, readWriteDatabase } from "../../database";
import {
  CreateUserDailyQueryCountData,
  UpdateUserDailyQueryCountData,
} from "../../database/model/user/daily-query-count";
import { userDailyQueryCounts } from "../../database/schema";

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
