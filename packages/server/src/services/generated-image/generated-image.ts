import { userGeneratedImages } from '@revelationsai/core/database/schema';
import type {
  CreateUserGeneratedImageData,
  UpdateUserGeneratedImageData,
  UserGeneratedImage
} from '@revelationsai/core/model/user/generated-image';
import { desc, eq, type SQL } from 'drizzle-orm';
import { db } from '../../lib/database';
import { cacheDelete, cacheGet, cacheUpsert, type CacheKeysInput } from '../../services/cache';

export const USER_GENERATED_IMAGES_CACHE_COLLECTION = 'userGeneratedImages';
export const defaultCacheKeysFn: CacheKeysInput<UserGeneratedImage> = (image) => [
  { name: 'id', value: image.id },
  { name: 'userId', value: image.userId, type: 'set' }
];

export async function getUserGeneratedImages(
  options: {
    where?: SQL<unknown>;
    limit?: number;
    offset?: number;
    orderBy?: SQL<unknown>;
  } = {}
) {
  const { where, limit = 25, offset = 0, orderBy = desc(userGeneratedImages.createdAt) } = options;

  return await db
    .select()
    .from(userGeneratedImages)
    .where(where)
    .limit(limit)
    .offset(offset)
    .orderBy(orderBy);
}

export async function getUserGeneratedImage(id: string) {
  return await cacheGet({
    collection: USER_GENERATED_IMAGES_CACHE_COLLECTION,
    key: { name: 'id', value: id },
    fn: async () =>
      (await db.select().from(userGeneratedImages).where(eq(userGeneratedImages.id, id))).at(0)
  });
}

export async function getUserGeneratedImageOrThrow(id: string) {
  const devotionImage = await getUserGeneratedImage(id);
  if (!devotionImage) {
    throw new Error(`UserGeneratedImage with id ${id} not found`);
  }
  return devotionImage;
}

export async function getUserGeneratedImagesByUserId(userId: string) {
  return await cacheGet({
    collection: USER_GENERATED_IMAGES_CACHE_COLLECTION,
    key: { name: 'userId', value: userId, type: 'set' },
    fn: async () =>
      await db.select().from(userGeneratedImages).where(eq(userGeneratedImages.userId, userId))
  });
}

export async function createUserGeneratedImage(data: CreateUserGeneratedImageData) {
  return await cacheUpsert({
    collection: USER_GENERATED_IMAGES_CACHE_COLLECTION,
    keys: defaultCacheKeysFn,
    fn: async () =>
      (
        await db
          .insert(userGeneratedImages)
          .values({
            ...data,
            createdAt: new Date(),
            updatedAt: new Date()
          })
          .returning()
      )[0]
  });
}

export async function updateUserGeneratedImage(id: string, data: UpdateUserGeneratedImageData) {
  return await cacheUpsert({
    collection: USER_GENERATED_IMAGES_CACHE_COLLECTION,
    keys: defaultCacheKeysFn,
    fn: async () =>
      (
        await db
          .update(userGeneratedImages)
          .set({
            ...data,
            createdAt: undefined,
            updatedAt: new Date()
          })
          .where(eq(userGeneratedImages.id, id))
          .returning()
      )[0],
    invalidateIterables: true
  });
}

export async function deleteUserGeneratedImage(id: string) {
  return await cacheDelete({
    collection: USER_GENERATED_IMAGES_CACHE_COLLECTION,
    keys: defaultCacheKeysFn,
    fn: async () =>
      (await db.delete(userGeneratedImages).where(eq(userGeneratedImages.id, id)).returning())[0]
  });
}
