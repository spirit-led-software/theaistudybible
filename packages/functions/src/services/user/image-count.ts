import type {
  CreateUserGeneratedImageCountData,
  UpdateUserGeneratedImageCountData,
} from "@core/model/user/image-count";
import { userGeneratedImageCounts } from "@core/schema";
import { readOnlyDatabase, readWriteDatabase } from "@lib/database";
import { SQL, and, desc, eq } from "drizzle-orm";

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
    orderBy = desc(userGeneratedImageCounts.createdAt),
  } = options;

  return await readOnlyDatabase
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
    orderBy = desc(userGeneratedImageCounts.createdAt),
  } = options;

  return await readOnlyDatabase
    .select()
    .from(userGeneratedImageCounts)
    .where(and(eq(userGeneratedImageCounts.userId, userId), where))
    .limit(limit)
    .offset(offset)
    .orderBy(orderBy);
}

export async function getUserGeneratedImageCountByUserIdAndDate(
  userId: string,
  date: Date
) {
  return (
    await readOnlyDatabase
      .select()
      .from(userGeneratedImageCounts)
      .where(
        and(
          eq(userGeneratedImageCounts.userId, userId),
          eq(userGeneratedImageCounts.date, date)
        )
      )
  ).at(0);
}

export async function createUserGeneratedImageCount(
  data: CreateUserGeneratedImageCountData
) {
  return (
    await readWriteDatabase
      .insert(userGeneratedImageCounts)
      .values(data)
      .returning()
  )[0];
}

export async function updateUserGeneratedImageCount(
  id: string,
  data: UpdateUserGeneratedImageCountData
) {
  return (
    await readWriteDatabase
      .update(userGeneratedImageCounts)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(userGeneratedImageCounts.id, id))
      .returning()
  )[0];
}

export async function incrementUserGeneratedImageCount(userId: string) {
  console.log("Incrementing user generated image count for user:", userId);

  const todaysImages = await getUserGeneratedImageCountByUserIdAndDate(
    userId,
    new Date()
  );

  if (todaysImages) {
    return await updateUserGeneratedImageCount(todaysImages.id, {
      count: todaysImages.count + 1,
    });
  } else {
    return await createUserGeneratedImageCount({
      userId,
      count: 1,
      date: new Date(),
    });
  }
}

export async function decrementUserGeneratedImageCount(userId: string) {
  console.log("Decrementing user generated image count for user:", userId);

  const todaysImages = await getUserGeneratedImageCountByUserIdAndDate(
    userId,
    new Date()
  );

  if (todaysImages) {
    return await updateUserGeneratedImageCount(todaysImages.id, {
      count: todaysImages.count > 0 ? todaysImages.count - 1 : 0,
    });
  } else {
    return await createUserGeneratedImageCount({
      userId,
      count: 0,
      date: new Date(),
    });
  }
}

export async function deleteUserGeneratedImageCount(id: string) {
  return (
    await readWriteDatabase
      .delete(userGeneratedImageCounts)
      .where(eq(userGeneratedImageCounts.id, id))
      .returning()
  )[0];
}
