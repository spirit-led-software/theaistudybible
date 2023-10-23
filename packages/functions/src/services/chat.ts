import type { CreateChatData, UpdateChatData } from "@core/model";
import { chats } from "@core/schema";
import { readOnlyDatabase, readWriteDatabase } from "@lib/database";
import type { Message } from "ai";
import { SQL, desc, eq } from "drizzle-orm";
import { LLMChain } from "langchain/chains";
import { PromptTemplate } from "langchain/prompts";
import { getLargeContextModel } from "./llm";

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

  return await readOnlyDatabase
    .select()
    .from(chats)
    .where(where)
    .limit(limit)
    .offset(offset)
    .orderBy(orderBy);
}

export async function getChat(id: string) {
  return (
    await readOnlyDatabase.select().from(chats).where(eq(chats.id, id))
  ).at(0);
}

export async function getChatOrThrow(id: string) {
  const chat = await getChat(id);
  if (!chat) {
    throw new Error(`Chat with id ${id} not found`);
  }
  return chat;
}

export async function createChat(data: CreateChatData) {
  return (
    await readWriteDatabase
      .insert(chats)
      .values({
        ...data,
        userNamed: data.name ? true : false,
      })
      .returning()
  )[0];
}

export async function updateChat(id: string, data: UpdateChatData) {
  return (
    await readWriteDatabase
      .update(chats)
      .set({
        ...data,
        userNamed: data.name ? true : false,
        updatedAt: new Date(),
      })
      .where(eq(chats.id, id))
      .returning()
  )[0];
}

export async function deleteChat(id: string) {
  return (
    await readWriteDatabase.delete(chats).where(eq(chats.id, id)).returning()
  )[0];
}

export async function aiRenameChat(id: string, history: Message[]) {
  const chat = await getChatOrThrow(id);
  if (chat.userNamed) {
    throw new Error("Chat has already been named by the user");
  }

  const renameChain = new LLMChain({
    llm: getLargeContextModel({
      stream: false,
      maxTokens: 128,
      promptSuffix: "<name>",
      stopSequences: ["</name>"],
    }),
    prompt: PromptTemplate.fromTemplate(
      `Your goal is to come up with a short and concise name for the chat outlined in the chat history below. It should be punctuated and capitalized as a proper title.
      
      The chat history is within <chat_history></chat_history> XML tags.
      
      <chat_history>
      {history}
      </chat_history>
      
      Put the name that you come up with in <name></name> XML tags.`
    ),
  });
  const result = await renameChain.call({
    history: history
      .map((message) => `${message.role}: ${message.content}`)
      .join("\n"),
  });

  return await updateChat(id, {
    name: result.text,
    userNamed: true,
  });
}
