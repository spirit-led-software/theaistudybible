import { cacheDelete, cacheGet, cacheGetTtl, cacheUpsert } from '../../services/cache';

export const USER_IMAGE_COUNTS_CACHE_COLLECTION = 'userGeneratedImageCounts';

export async function getUserGeneratedImageCount(userId: string): Promise<number | null> {
  return await cacheGet({
    collection: USER_IMAGE_COUNTS_CACHE_COLLECTION,
    key: {
      name: 'userId',
      value: userId
    }
  });
}

export async function upsertUserGeneratedImageCount(userId: string, count: number) {
  return await cacheUpsert({
    collection: USER_IMAGE_COUNTS_CACHE_COLLECTION,
    keys: () => [
      {
        name: 'userId',
        value: userId,
        type: 'string'
      }
    ],
    fn: () => count,
    expireSeconds: 60 * 60 * 8 // 8 hours
  });
}

export async function incrementUserGeneratedImageCount(userId: string) {
  console.log('Incrementing user generated image count for user:', userId);

  const todaysImages = await getUserGeneratedImageCount(userId);
  return await upsertUserGeneratedImageCount(userId, (todaysImages ?? 0) + 1);
}

export async function decrementUserGeneratedImageCount(userId: string) {
  console.log('Decrementing user generated image count for user:', userId);

  const todaysImages = await getUserGeneratedImageCount(userId);
  return await upsertUserGeneratedImageCount(userId, (todaysImages ?? 1) - 1);
}

export async function deleteUserGeneratedImageCount(userId: string) {
  return await cacheDelete({
    collection: USER_IMAGE_COUNTS_CACHE_COLLECTION,
    keys: [
      {
        name: 'userId',
        value: userId,
        type: 'string'
      }
    ]
  });
}

export async function getUserGeneratedImageCountTtl(userId: string) {
  return await cacheGetTtl({
    collection: USER_IMAGE_COUNTS_CACHE_COLLECTION,
    key: {
      name: 'userId',
      value: userId
    }
  });
}
