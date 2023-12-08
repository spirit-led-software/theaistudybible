import type { CreateChatData, UpdateChatData } from '@core/model';
import { chats, devotions } from '@core/schema';
import { readOnlyDatabase, readWriteDatabase } from '@lib/database';
import { getDevotions } from '@services/devotion';
import type { Message } from 'ai';
import { SQL, desc, eq, sql } from 'drizzle-orm';
import { PromptTemplate } from 'langchain/prompts';
import { StringOutputParser } from 'langchain/schema/output_parser';
import { getLargeContextModel } from '../llm';
import {
  CHAT_DAILY_QUERY_GENERATOR_PROMPT_TEMPLATE,
  CHAT_RENAME_CHAIN_PROMPT_TEMPLATE
} from './prompts';

export async function getChats(
  options: {
    where?: SQL<unknown>;
    limit?: number;
    offset?: number;
    orderBy?: SQL<unknown>;
  } = {}
) {
  const { where, limit = 25, offset = 0, orderBy = desc(chats.createdAt) } = options;

  return await readOnlyDatabase
    .select()
    .from(chats)
    .where(where)
    .limit(limit)
    .offset(offset)
    .orderBy(orderBy);
}

export async function getChat(id: string) {
  return (await readOnlyDatabase.select().from(chats).where(eq(chats.id, id))).at(0);
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
        customName: data.name && data.name != 'New Chat' ? true : false,
        ...data,
        createdAt: new Date(),
        updatedAt: new Date()
      })
      .returning()
  )[0];
}

export async function updateChat(id: string, data: UpdateChatData) {
  return (
    await readWriteDatabase
      .update(chats)
      .set({
        customName: sql`${chats.customName} OR ${
          data.name && data.name != 'New Chat' ? true : false
        }`,
        ...data,
        createdAt: undefined,
        updatedAt: new Date()
      })
      .where(eq(chats.id, id))
      .returning()
  )[0];
}

export async function deleteChat(id: string) {
  return (await readWriteDatabase.delete(chats).where(eq(chats.id, id)).returning())[0];
}

export async function aiRenameChat(id: string, history: Message[]) {
  const chat = await getChatOrThrow(id);
  if (chat.customName) {
    throw new Error('Chat has already been named by the user');
  }

  const renameChain = PromptTemplate.fromTemplate(CHAT_RENAME_CHAIN_PROMPT_TEMPLATE)
    .pipe(
      getLargeContextModel({
        stream: false,
        maxTokens: 256,
        promptSuffix: '<title>',
        stopSequences: ['</title>']
      })
    )
    .pipe(new StringOutputParser());

  const result = await renameChain.invoke({
    history: history
      .map(
        (message) =>
          `<message>\n<sender>${message.role}</sender>\n<text>${message.content}</text>\n</message>`
      )
      .join('\n')
  });

  return await updateChat(id, {
    name: result,
    customName: false
  });
}

export async function getDailyQuery() {
  const queryChain = PromptTemplate.fromTemplate(CHAT_DAILY_QUERY_GENERATOR_PROMPT_TEMPLATE)
    .pipe(
      getLargeContextModel({
        stream: false,
        maxTokens: 256,
        promptSuffix: '<query>',
        stopSequences: ['</query>']
      })
    )
    .pipe(new StringOutputParser());

  return await queryChain.invoke({
    devotion: await getDevotions({
      limit: 1,
      orderBy: desc(devotions.createdAt)
    })
      .then((devotions) => devotions[0])
      .then((devotion) => {
        return [
          `<topic>${devotion.topic}</topic>`,
          `<bible_reading>${devotion.bibleReading}</bible_reading>`,
          `<summary>${devotion.summary}</summary>`,
          `<reflection>${devotion.reflection}</reflection>`,
          `<prayer>${devotion.prayer}</prayer>`
        ].join('\n');
      })
  });
}
