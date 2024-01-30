import { cacheDelete, cacheGet, cacheGetTtl, cacheUpsert } from '../../services/cache';

export const USER_QUERY_COUNTS_CACHE_COLLECTION = 'userQueryCounts';

export async function getUserQueryCount(userId: string): Promise<number | null> {
  return await cacheGet({
    collection: USER_QUERY_COUNTS_CACHE_COLLECTION,
    key: {
      name: 'userId',
      value: userId
    }
  });
}

export async function upsertUserQueryCount(userId: string, count: number) {
  return await cacheUpsert({
    collection: USER_QUERY_COUNTS_CACHE_COLLECTION,
    keys: () => [
      {
        name: 'userId',
        value: userId,
        type: 'string'
      }
    ],
    fn: () => count,
    expireSeconds: 60 * 60 * 1 // 1 hour
  });
}

export async function incrementUserQueryCount(userId: string) {
  console.log('Incrementing user query count for user:', userId);
  const todaysQueries = await getUserQueryCount(userId);
  return await upsertUserQueryCount(userId, (todaysQueries ?? 0) + 1);
}

export async function decrementUserQueryCount(userId: string) {
  console.log('Decrementing user query count for user:', userId);
  const todaysQueries = await getUserQueryCount(userId);
  return await upsertUserQueryCount(userId, (todaysQueries ?? 1) - 1);
}

export async function deleteUserQueryCount(userId: string) {
  return await cacheDelete({
    collection: USER_QUERY_COUNTS_CACHE_COLLECTION,
    keys: [
      {
        name: 'userId',
        value: userId,
        type: 'string'
      }
    ]
  });
}

export async function getUserQueryCountTtl(userId: string) {
  return await cacheGetTtl({
    collection: USER_QUERY_COUNTS_CACHE_COLLECTION,
    key: {
      name: 'userId',
      value: userId
    }
  });
}
