import { userPasswords } from '@revelationsai/core/database/schema';
import type {
  CreateUserPasswordData,
  UpdateUserPasswordData
} from '@revelationsai/core/model/user/password';
import { SQL, desc, eq } from 'drizzle-orm';
import { db } from '../../lib/database';

export async function getUserPasswords(
  options: {
    where?: SQL<unknown>;
    limit?: number;
    offset?: number;
    orderBy?: SQL<unknown>;
  } = {}
) {
  const { where, limit = 25, offset = 0, orderBy = desc(userPasswords.createdAt) } = options;

  return await db
    .select()
    .from(userPasswords)
    .where(where)
    .limit(limit)
    .offset(offset)
    .orderBy(orderBy);
}

export async function getUserPasswordByUserId(userId: string) {
  return (await db.select().from(userPasswords).where(eq(userPasswords.userId, userId)))[0];
}

export async function createUserPassword(data: CreateUserPasswordData) {
  return (
    await db
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
    await db
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
    await db
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
