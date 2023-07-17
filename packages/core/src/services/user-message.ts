import { SQL, desc, eq } from "drizzle-orm";
import { db } from "../database";
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

  return await db
    .select()
    .from(userMessages)
    .where(where)
    .limit(limit)
    .offset(offset)
    .orderBy(orderBy);
}

export async function getUserMessage(id: string) {
  return (
    await db.select().from(userMessages).where(eq(userMessages.id, id))
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
  return await db
    .select()
    .from(userMessages)
    .where(eq(userMessages.chatId, chatId));
}

export async function createUserMessage(data: CreateUserMessageData) {
  return (await db.insert(userMessages).values(data).returning())[0];
}

export async function updateUserMessage(
  id: string,
  data: UpdateUserMessageData
) {
  return (
    await db
      .update(userMessages)
      .set(data)
      .where(eq(userMessages.id, id))
      .returning()
  )[0];
}

export async function deleteUserMessage(id: string) {
  return (
    await db.delete(userMessages).where(eq(userMessages.id, id)).returning()
  )[0];
}
