import type {
  CreateUserQueryCountData,
  UpdateUserQueryCountData
} from '@core/model/user/query-count';
import { userQueryCounts } from '@core/schema';
import { readOnlyDatabase, readWriteDatabase } from '@lib/database';
import { SQL, and, desc, eq, sql } from 'drizzle-orm';

export async function getUserQueryCounts(
  options: {
    where?: SQL<unknown>;
    limit?: number;
    offset?: number;
    orderBy?: SQL<unknown>;
  } = {}
) {
  const { where, limit = 25, offset = 0, orderBy = desc(userQueryCounts.createdAt) } = options;

  return await readOnlyDatabase
    .select()
    .from(userQueryCounts)
    .where(where)
    .limit(limit)
    .offset(offset)
    .orderBy(orderBy);
}

export async function getUserQueryCountsByUserId(
  userId: string,
  options: {
    where?: SQL<unknown>;
    limit?: number;
    offset?: number;
    orderBy?: SQL<unknown>;
  } = {}
) {
  const { where, limit = 25, offset = 0, orderBy = desc(userQueryCounts.createdAt) } = options;

  return await readOnlyDatabase
    .select()
    .from(userQueryCounts)
    .where(and(eq(userQueryCounts.userId, userId), where))
    .limit(limit)
    .offset(offset)
    .orderBy(orderBy);
}

export async function getUserQueryCountByUserIdAndDate(userId: string, date: Date) {
  return (
    await readOnlyDatabase
      .select()
      .from(userQueryCounts)
      .where(
        and(
          eq(userQueryCounts.userId, userId),
          sql`${userQueryCounts.createdAt}::date = ${date}::date`
        )
      )
  ).at(0);
}

export async function createUserQueryCount(data: CreateUserQueryCountData) {
  return (
    await readWriteDatabase
      .insert(userQueryCounts)
      .values({
        ...data,
        createdAt: new Date(),
        updatedAt: new Date()
      })
      .returning()
  )[0];
}

export async function updateUserQueryCount(id: string, data: UpdateUserQueryCountData) {
  return (
    await readWriteDatabase
      .update(userQueryCounts)
      .set({
        ...data,
        createdAt: undefined,
        updatedAt: new Date()
      })
      .where(eq(userQueryCounts.id, id))
      .returning()
  )[0];
}

export async function incrementUserQueryCount(userId: string) {
  console.log('Incrementing user query count for user:', userId);

  const todaysQueries = await getUserQueryCountByUserIdAndDate(userId, new Date());

  if (todaysQueries) {
    return await updateUserQueryCount(todaysQueries.id, {
      count: todaysQueries.count + 1
    });
  } else {
    return await createUserQueryCount({
      userId,
      count: 1
    });
  }
}

export async function decrementUserQueryCount(userId: string) {
  console.log('Decrementing user query count for user:', userId);

  const todaysQueries = await getUserQueryCountByUserIdAndDate(userId, new Date());

  if (todaysQueries) {
    return await updateUserQueryCount(todaysQueries.id, {
      count: todaysQueries.count > 0 ? todaysQueries.count - 1 : 0
    });
  } else {
    return await createUserQueryCount({
      userId,
      count: 0
    });
  }
}

export async function deleteUserQueryCount(id: string) {
  return (
    await readWriteDatabase.delete(userQueryCounts).where(eq(userQueryCounts.id, id)).returning()
  )[0];
}
