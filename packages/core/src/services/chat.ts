import { SQL, desc, eq } from "drizzle-orm";
import { readDatabase, writeDatabase } from "../database";
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

  return await readDatabase
    .select()
    .from(chats)
    .where(where)
    .limit(limit)
    .offset(offset)
    .orderBy(orderBy);
}

export async function getChat(id: string) {
  return (await readDatabase.select().from(chats).where(eq(chats.id, id))).at(
    0
  );
}

export async function getChatOrThrow(id: string) {
  const chat = await getChat(id);
  if (!chat) {
    throw new Error(`Chat with id ${id} not found`);
  }
  return chat;
}

export async function createChat(data: CreateChatData) {
  return (await writeDatabase.insert(chats).values(data).returning())[0];
}

export async function updateChat(id: string, data: UpdateChatData) {
  return (
    await writeDatabase
      .update(chats)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(chats.id, id))
      .returning()
  )[0];
}

export async function deleteChat(id: string) {
  return (
    await readDatabase.delete(chats).where(eq(chats.id, id)).returning()
  )[0];
}
