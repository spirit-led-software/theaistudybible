import type { CreateUserMessageData, UpdateUserMessageData } from '@core/model';
import { userMessages } from '@core/schema';
import { readOnlyDatabase, readWriteDatabase } from '@lib/database';
import { SQL, and, desc, eq, sql } from 'drizzle-orm';

export async function getUserMessages(
  options: {
    where?: SQL<unknown>;
    limit?: number;
    offset?: number;
    orderBy?: SQL<unknown>;
  } = {}
) {
  const { where, limit = 25, offset = 0, orderBy = desc(userMessages.createdAt) } = options;

  return await readOnlyDatabase
    .select()
    .from(userMessages)
    .where(where)
    .limit(limit)
    .offset(offset)
    .orderBy(orderBy);
}

export async function getUserMessage(id: string) {
  return (await readOnlyDatabase.select().from(userMessages).where(eq(userMessages.id, id))).at(0);
}

export async function getUserMessageOrThrow(id: string) {
  const userMessage = await getUserMessage(id);
  if (!userMessage) {
    throw new Error(`UserMessage with id ${id} not found`);
  }
  return userMessage;
}

export async function getUserMessagesByChatId(chatId: string) {
  return await readOnlyDatabase
    .select()
    .from(userMessages)
    .where(eq(userMessages.chatId, chatId))
    .orderBy(desc(userMessages.createdAt));
}

export async function getUserMessagesByChatIdAndText(chatId: string, text: string) {
  return await readOnlyDatabase
    .select()
    .from(userMessages)
    .where(and(eq(userMessages.chatId, chatId), eq(userMessages.text, text)))
    .orderBy(desc(userMessages.createdAt));
}

export async function createUserMessage(data: CreateUserMessageData) {
  return (
    await readWriteDatabase
      .insert(userMessages)
      .values({
        ...data,
        createdAt: new Date(),
        updatedAt: new Date()
      })
      .returning()
  )[0];
}

export async function updateUserMessage(id: string, data: UpdateUserMessageData) {
  return (
    await readWriteDatabase
      .update(userMessages)
      .set({
        ...data,
        createdAt: undefined,
        updatedAt: new Date()
      })
      .where(eq(userMessages.id, id))
      .returning()
  )[0];
}

export async function deleteUserMessage(id: string) {
  return (
    await readWriteDatabase.delete(userMessages).where(eq(userMessages.id, id)).returning()
  )[0];
}

export async function getMostAskedUserMessages(count: number) {
  return await readOnlyDatabase
    .select({
      text: userMessages.text,
      count: sql`COUNT(*)`
    })
    .from(userMessages)
    .groupBy(userMessages.text)
    .orderBy(sql`COUNT(*) DESC`)
    .limit(count);
}
