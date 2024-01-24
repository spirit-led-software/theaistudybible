import type {
  CreateUserQueryCountData,
  UpdateUserQueryCountData,
  UserQueryCount
} from '@core/model/user/query-count';
import { userQueryCounts } from '@core/schema';
import { db } from '@lib/database/database';
import { cacheDelete, cacheGet, cacheUpsert, type CacheKeysInput } from '@services/cache';
import { SQL, and, desc, eq, sql } from 'drizzle-orm';

export const USER_QUERY_COUNTS_CACHE_COLLECTION = 'userQueryCounts';
export const defaultCacheKeysFn: CacheKeysInput<UserQueryCount> = (queryCount) => [
  { keyName: 'id', keyValue: queryCount.id },
  { keyName: 'userId', keyValue: queryCount.userId },
  { keyName: 'createdAt', keyValue: queryCount.createdAt.toISOString() },
  {
    keyName: 'userId:createdAt',
    keyValue: `${queryCount.userId}:${queryCount.createdAt.toISOString()}`
  }
];

export async function getUserQueryCounts(
  options: {
    where?: SQL<unknown>;
    limit?: number;
    offset?: number;
    orderBy?: SQL<unknown>;
  } = {}
) {
  const { where, limit = 25, offset = 0, orderBy = desc(userQueryCounts.createdAt) } = options;

  return await db
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

  return await db
    .select()
    .from(userQueryCounts)
    .where(and(eq(userQueryCounts.userId, userId), where))
    .limit(limit)
    .offset(offset)
    .orderBy(orderBy);
}

export async function getUserQueryCountByUserIdAndDate(userId: string, date: Date) {
  return await cacheGet({
    collection: USER_QUERY_COUNTS_CACHE_COLLECTION,
    key: {
      keyName: `${'userId'}_${'createdAt'}`,
      keyValue: `${userId}_${date.toISOString()}`
    },
    fn: async () =>
      (
        await db
          .select()
          .from(userQueryCounts)
          .where(
            and(
              eq(userQueryCounts.userId, userId),
              sql`${userQueryCounts.createdAt}::date = ${date}::date`
            )
          )
      ).at(0)
  });
}

export async function createUserQueryCount(data: CreateUserQueryCountData) {
  return await cacheUpsert({
    collection: USER_QUERY_COUNTS_CACHE_COLLECTION,
    keys: defaultCacheKeysFn,
    fn: async () =>
      (
        await db
          .insert(userQueryCounts)
          .values({
            ...data,
            createdAt: new Date(),
            updatedAt: new Date()
          })
          .returning()
      )[0]
  });
}

export async function updateUserQueryCount(id: string, data: UpdateUserQueryCountData) {
  return await cacheUpsert({
    collection: USER_QUERY_COUNTS_CACHE_COLLECTION,
    keys: defaultCacheKeysFn,
    fn: async () =>
      (
        await db
          .update(userQueryCounts)
          .set({
            ...data,
            createdAt: undefined,
            updatedAt: new Date()
          })
          .where(eq(userQueryCounts.id, id))
          .returning()
      )[0]
  });
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
  return await cacheDelete({
    collection: USER_QUERY_COUNTS_CACHE_COLLECTION,
    keys: defaultCacheKeysFn,
    fn: async () =>
      (await db.delete(userQueryCounts).where(eq(userQueryCounts.id, id)).returning())[0]
  });
}
