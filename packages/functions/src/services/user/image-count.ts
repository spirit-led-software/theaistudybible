import type {
  CreateUserGeneratedImageCountData,
  UpdateUserGeneratedImageCountData,
  UserGeneratedImageCount
} from '@core/model/user/image-count';
import { userGeneratedImageCounts } from '@core/schema';
import { db } from '@lib/database/database';
import { cacheDelete, cacheGet, cacheUpsert, type CacheKeysInput } from '@services/cache';
import { SQL, and, desc, eq, sql } from 'drizzle-orm';

export const USER_IMAGE_COUNTS_CACHE_COLLECTION = 'userGeneratedImageCounts';
export const defaultCacheKeysFn: CacheKeysInput<UserGeneratedImageCount> = (imageCount) => [
  { keyName: 'id', keyValue: imageCount.id },
  { keyName: 'userId', keyValue: imageCount.userId },
  {
    keyName: 'createdAt',
    keyValue: imageCount.createdAt.toISOString()
  },
  {
    keyName: 'userId_createdAt',
    keyValue: `${imageCount.userId}_${imageCount.createdAt.toISOString()}`
  }
];

export async function getUserGeneratedImageCounts(
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
    orderBy = desc(userGeneratedImageCounts.createdAt)
  } = options;

  return await db
    .select()
    .from(userGeneratedImageCounts)
    .where(where)
    .limit(limit)
    .offset(offset)
    .orderBy(orderBy);
}

export async function getUserGeneratedImageCountsByUserId(
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
    orderBy = desc(userGeneratedImageCounts.createdAt)
  } = options;

  return await db
    .select()
    .from(userGeneratedImageCounts)
    .where(and(eq(userGeneratedImageCounts.userId, userId), where))
    .limit(limit)
    .offset(offset)
    .orderBy(orderBy);
}

export async function getUserGeneratedImageCountByUserIdAndDate(userId: string, date: Date) {
  return await cacheGet({
    collection: USER_IMAGE_COUNTS_CACHE_COLLECTION,
    key: {
      keyName: `${'userId'}_${'createdAt'}`,
      keyValue: `${userId}_${date.toISOString()}`
    },
    fn: async () =>
      (
        await db
          .select()
          .from(userGeneratedImageCounts)
          .where(
            and(
              eq(userGeneratedImageCounts.userId, userId),
              sql`${userGeneratedImageCounts.createdAt}::date = ${date}::date`
            )
          )
      ).at(0)
  });
}

export async function createUserGeneratedImageCount(data: CreateUserGeneratedImageCountData) {
  return await cacheUpsert({
    collection: USER_IMAGE_COUNTS_CACHE_COLLECTION,
    keys: defaultCacheKeysFn,
    fn: async () =>
      (
        await db
          .insert(userGeneratedImageCounts)
          .values({
            ...data,
            createdAt: new Date(),
            updatedAt: new Date()
          })
          .returning()
      )[0]
  });
}

export async function updateUserGeneratedImageCount(
  id: string,
  data: UpdateUserGeneratedImageCountData
) {
  return await cacheUpsert({
    collection: USER_IMAGE_COUNTS_CACHE_COLLECTION,
    keys: defaultCacheKeysFn,
    fn: async () =>
      (
        await db
          .update(userGeneratedImageCounts)
          .set({
            ...data,
            createdAt: undefined,
            updatedAt: new Date()
          })
          .where(eq(userGeneratedImageCounts.id, id))
          .returning()
      )[0]
  });
}

export async function incrementUserGeneratedImageCount(userId: string) {
  console.log('Incrementing user generated image count for user:', userId);

  const todaysImages = await getUserGeneratedImageCountByUserIdAndDate(userId, new Date());

  if (todaysImages) {
    return await updateUserGeneratedImageCount(todaysImages.id, {
      count: todaysImages.count + 1
    });
  } else {
    return await createUserGeneratedImageCount({
      userId,
      count: 1
    });
  }
}

export async function decrementUserGeneratedImageCount(userId: string) {
  console.log('Decrementing user generated image count for user:', userId);

  const todaysImages = await getUserGeneratedImageCountByUserIdAndDate(userId, new Date());

  if (todaysImages) {
    return await updateUserGeneratedImageCount(todaysImages.id, {
      count: todaysImages.count > 0 ? todaysImages.count - 1 : 0
    });
  } else {
    return await createUserGeneratedImageCount({
      userId,
      count: 0
    });
  }
}

export async function deleteUserGeneratedImageCount(id: string) {
  return await cacheDelete({
    collection: USER_IMAGE_COUNTS_CACHE_COLLECTION,
    keys: defaultCacheKeysFn,
    fn: async () =>
      (
        await db
          .delete(userGeneratedImageCounts)
          .where(eq(userGeneratedImageCounts.id, id))
          .returning()
      )[0]
  });
}
