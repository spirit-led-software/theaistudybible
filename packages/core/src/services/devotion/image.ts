import { SQL, desc, eq } from "drizzle-orm";
import { readOnlyDatabase, readWriteDatabase } from "../../database";
import {
  CreateDevotionImageData,
  UpdateDevotionImageData,
} from "../../database/model/devotion";
import { devotionImages } from "../../database/schema";

export async function getDevotionImages(
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
    orderBy = desc(devotionImages.createdAt),
  } = options;

  return await readOnlyDatabase
    .select()
    .from(devotionImages)
    .where(where)
    .limit(limit)
    .offset(offset)
    .orderBy(orderBy);
}

export async function getDevotionImage(id: string) {
  return (
    await readOnlyDatabase
      .select()
      .from(devotionImages)
      .where(eq(devotionImages.id, id))
  ).at(0);
}

export async function getDevotionImageOrThrow(id: string) {
  const devotionImage = await getDevotionImage(id);
  if (!devotionImage) {
    throw new Error(`DevotionImage with id ${id} not found`);
  }
  return devotionImage;
}

export async function getDevotionImagesByDevotionId(devotionId: string) {
  return await readOnlyDatabase
    .select()
    .from(devotionImages)
    .where(eq(devotionImages.devotionId, devotionId));
}

export async function createDevotionImage(data: CreateDevotionImageData) {
  return (
    await readWriteDatabase.insert(devotionImages).values(data).returning()
  )[0];
}

export async function updateDevotionImage(
  id: string,
  data: UpdateDevotionImageData
) {
  return (
    await readWriteDatabase
      .update(devotionImages)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(devotionImages.id, id))
      .returning()
  )[0];
}

export async function deleteDevotionImage(id: string) {
  return (
    await readWriteDatabase
      .delete(devotionImages)
      .where(eq(devotionImages.id, id))
      .returning()
  )[0];
}
