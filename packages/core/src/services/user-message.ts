import { SQL, and, desc, eq } from "drizzle-orm";
import { readOnlyDatabase, readWriteDatabase } from "../database";
import {
  CreateUserMessageData,
  UpdateUserMessageData,
} from "../database/model";
import { userMessages } from "../database/schema";

export async function getUserMessages(
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
    orderBy = desc(userMessages.createdAt),
  } = options;

  return await readOnlyDatabase
    .select()
    .from(userMessages)
    .where(where)
    .limit(limit)
    .offset(offset)
    .orderBy(orderBy);
}

export async function getUserMessage(id: string) {
  return (
    await readOnlyDatabase
      .select()
      .from(userMessages)
      .where(eq(userMessages.id, id))
  ).at(0);
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

export async function getUserMessagesByChatIdAndText(
  chatId: string,
  text: string
) {
  return await readOnlyDatabase
    .select()
    .from(userMessages)
    .where(and(eq(userMessages.chatId, chatId), eq(userMessages.text, text)))
    .orderBy(desc(userMessages.createdAt));
}

export async function createUserMessage(data: CreateUserMessageData) {
  return (
    await readWriteDatabase.insert(userMessages).values(data).returning()
  )[0];
}

export async function updateUserMessage(
  id: string,
  data: UpdateUserMessageData
) {
  return (
    await readWriteDatabase
      .update(userMessages)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(userMessages.id, id))
      .returning()
  )[0];
}

export async function deleteUserMessage(id: string) {
  return (
    await readWriteDatabase
      .delete(userMessages)
      .where(eq(userMessages.id, id))
      .returning()
  )[0];
}
