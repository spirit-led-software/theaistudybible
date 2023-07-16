import { SQL, desc, eq } from "drizzle-orm";
import { db } from "../database";
import { CreateChatData, UpdateChatData } from "../database/model";
import { chats } from "../database/schema";

export async function getChats(
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
    orderBy = desc(chats.createdAt),
  } = options;

  return await db.query.chats.findMany({
    where,
    limit,
    offset,
    orderBy,
  });
}

export async function getChat(id: string) {
  return await db.query.chats.findFirst({
    where: eq(chats.id, id),
    with: {
      userMessages: true,
      aiResponses: true,
      user: true,
    },
  });
}

export async function getChatOrThrow(id: string) {
  const chat = await getChat(id);
  if (!chat) {
    throw new Error(`Chat with id ${id} not found`);
  }
  return chat;
}

export async function createChat(data: CreateChatData) {
  return (await db.insert(chats).values(data).returning())[0];
}

export async function updateChat(id: string, data: UpdateChatData) {
  return (
    await db.update(chats).set(data).where(eq(chats.id, id)).returning()
  )[0];
}

export async function deleteChat(id: string) {
  return (await db.delete(chats).where(eq(chats.id, id)).returning())[0];
}
