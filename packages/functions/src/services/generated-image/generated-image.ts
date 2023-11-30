import type { CreateUserGeneratedImageData, UpdateUserGeneratedImageData } from '@core/model';
import { userGeneratedImages } from '@core/schema';
import { readOnlyDatabase, readWriteDatabase } from '@lib/database';
import { SQL, desc, eq } from 'drizzle-orm';

export async function getUserGeneratedImages(
  options: {
    where?: SQL<unknown>;
    limit?: number;
    offset?: number;
    orderBy?: SQL<unknown>;
  } = {}
) {
  const { where, limit = 25, offset = 0, orderBy = desc(userGeneratedImages.createdAt) } = options;

  return await readOnlyDatabase
    .select()
    .from(userGeneratedImages)
    .where(where)
    .limit(limit)
    .offset(offset)
    .orderBy(orderBy);
}

export async function getUserGeneratedImage(id: string) {
  return (
    await readOnlyDatabase.select().from(userGeneratedImages).where(eq(userGeneratedImages.id, id))
  ).at(0);
}

export async function getUserGeneratedImageOrThrow(id: string) {
  const devotionImage = await getUserGeneratedImage(id);
  if (!devotionImage) {
    throw new Error(`UserGeneratedImage with id ${id} not found`);
  }
  return devotionImage;
}

export async function getUserGeneratedImagesByUserId(userId: string) {
  return await readOnlyDatabase
    .select()
    .from(userGeneratedImages)
    .where(eq(userGeneratedImages.userId, userId));
}

export async function createUserGeneratedImage(data: CreateUserGeneratedImageData) {
  return (
    await readWriteDatabase
      .insert(userGeneratedImages)
      .values({
        ...data,
        createdAt: new Date(),
        updatedAt: new Date()
      })
      .returning()
  )[0];
}

export async function updateUserGeneratedImage(id: string, data: UpdateUserGeneratedImageData) {
  return (
    await readWriteDatabase
      .update(userGeneratedImages)
      .set({
        ...data,
        createdAt: undefined,
        updatedAt: new Date()
      })
      .where(eq(userGeneratedImages.id, id))
      .returning()
  )[0];
}

export async function deleteUserGeneratedImage(id: string) {
  return (
    await readWriteDatabase
      .delete(userGeneratedImages)
      .where(eq(userGeneratedImages.id, id))
      .returning()
  )[0];
}
