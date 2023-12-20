import type { CreateUserPasswordData, UpdateUserPasswordData } from '@core/model/user/password';
import { userPasswords } from '@core/schema';
import { readOnlyDatabase, readWriteDatabase } from '@lib/database';
import { SQL, desc, eq } from 'drizzle-orm';

export async function getUserPasswords(
  options: {
    where?: SQL<unknown>;
    limit?: number;
    offset?: number;
    orderBy?: SQL<unknown>;
  } = {}
) {
  const { where, limit = 25, offset = 0, orderBy = desc(userPasswords.createdAt) } = options;

  return await readOnlyDatabase
    .select()
    .from(userPasswords)
    .where(where)
    .limit(limit)
    .offset(offset)
    .orderBy(orderBy);
}

export async function getUserPasswordByUserId(userId: string) {
  return (
    await readOnlyDatabase.select().from(userPasswords).where(eq(userPasswords.userId, userId))
  )[0];
}

export async function createUserPassword(data: CreateUserPasswordData) {
  return (
    await readWriteDatabase
      .insert(userPasswords)
      .values({
        ...data,
        createdAt: new Date(),
        updatedAt: new Date()
      })
      .returning()
  )[0];
}

export async function updateUserPassword(id: string, data: UpdateUserPasswordData) {
  return (
    await readWriteDatabase
      .update(userPasswords)
      .set({
        ...data,
        createdAt: undefined,
        updatedAt: new Date()
      })
      .where(eq(userPasswords.id, id))
      .returning()
  )[0];
}

export async function updateUserPasswordByUserId(userId: string, data: UpdateUserPasswordData) {
  return (
    await readWriteDatabase
      .update(userPasswords)
      .set({
        ...data,
        createdAt: undefined,
        updatedAt: new Date()
      })
      .where(eq(userPasswords.userId, userId))
      .returning()
  )[0];
}
