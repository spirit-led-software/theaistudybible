import { devotionImages } from '@revelationsai/core/database/schema';
import type {
  CreateDevotionImageData,
  DevotionImage,
  UpdateDevotionImageData
} from '@revelationsai/core/model/devotion/image';
import { desc, eq, type SQL } from 'drizzle-orm';
import { db } from '../../lib/database';
import { cacheDelete, cacheGet, cacheUpsert, type CacheKeysInputFn } from '../../services/cache';

export const DEVOTION_IMAGES_CACHE_COLLECTION = 'devotionImages';
export const defaultCacheKeysFn: CacheKeysInputFn<DevotionImage> = (image) => [
  { name: 'id', value: image.id },
  { name: 'devotionId', value: image.devotionId, type: 'set' }
];
export const DEVOTIONS_CACHE_TTL_SECONDS = 60 * 60 * 24; // 1 day

export async function getDevotionImages(
  options: {
    where?: SQL<unknown>;
    limit?: number;
    offset?: number;
    orderBy?: SQL<unknown>;
  } = {}
) {
  const { where, limit = 25, offset = 0, orderBy = desc(devotionImages.createdAt) } = options;

  return await db
    .select()
    .from(devotionImages)
    .where(where)
    .limit(limit)
    .offset(offset)
    .orderBy(orderBy);
}

export async function getDevotionImage(id: string) {
  return await cacheGet({
    collection: DEVOTION_IMAGES_CACHE_COLLECTION,
    key: { name: 'id', value: id },
    fn: async () => (await db.select().from(devotionImages).where(eq(devotionImages.id, id))).at(0),
    expireSeconds: DEVOTIONS_CACHE_TTL_SECONDS
  });
}

export async function getDevotionImageOrThrow(id: string) {
  const devotionImage = await getDevotionImage(id);
  if (!devotionImage) {
    throw new Error(`DevotionImage with id ${id} not found`);
  }
  return devotionImage;
}

export async function getDevotionImagesByDevotionId(devotionId: string) {
  return await cacheGet({
    collection: DEVOTION_IMAGES_CACHE_COLLECTION,
    key: { name: 'devotionId', value: devotionId, type: 'set' },
    fn: async () =>
      await db.select().from(devotionImages).where(eq(devotionImages.devotionId, devotionId)),
    expireSeconds: DEVOTIONS_CACHE_TTL_SECONDS
  });
}

export async function createDevotionImage(data: CreateDevotionImageData) {
  return await cacheUpsert({
    collection: DEVOTION_IMAGES_CACHE_COLLECTION,
    keys: defaultCacheKeysFn,
    fn: async () =>
      (
        await db
          .insert(devotionImages)
          .values({
            ...data,
            createdAt: new Date(),
            updatedAt: new Date()
          })
          .returning()
      )[0],
    expireSeconds: DEVOTIONS_CACHE_TTL_SECONDS
  });
}

export async function updateDevotionImage(id: string, data: UpdateDevotionImageData) {
  const image = await cacheUpsert({
    collection: DEVOTION_IMAGES_CACHE_COLLECTION,
    keys: [{ name: 'id', value: id }],
    fn: async () =>
      (
        await db
          .update(devotionImages)
          .set({
            ...data,
            createdAt: undefined,
            updatedAt: new Date()
          })
          .where(eq(devotionImages.id, id))
          .returning()
      )[0],
    expireSeconds: DEVOTIONS_CACHE_TTL_SECONDS,
    invalidateIterables: true
  });
  return image;
}

export async function deleteDevotionImage(id: string) {
  return await cacheDelete({
    collection: DEVOTION_IMAGES_CACHE_COLLECTION,
    keys: defaultCacheKeysFn,
    fn: async () =>
      (await db.delete(devotionImages).where(eq(devotionImages.id, id)).returning())[0]
  });
}
