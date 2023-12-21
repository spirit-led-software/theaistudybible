import type { Chat } from '@core/model/chat';
import { devotions } from '@core/schema';
import { updateChat } from '@services/chat';
import {
  CHAT_DAILY_QUERY_GENERATOR_PROMPT_TEMPLATE,
  CHAT_RENAME_CHAIN_PROMPT_TEMPLATE
} from '@services/chat/prompts';
import { getDevotions } from '@services/devotion';
import { getLargeContextModel } from '@services/llm';
import type { Message } from 'ai';
import { desc } from 'drizzle-orm';
import { PromptTemplate } from 'langchain/prompts';
import { StringOutputParser } from 'langchain/schema/output_parser';

export async function aiRenameChat(chat: Chat, history: Message[]) {
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

  const result = await renameChain
    .invoke({
      history: history
        .slice(-20)
        .map(
          (message) =>
            `<message>\n<sender>${message.role}</sender>\n<text>${message.content}</text>\n</message>`
        )
        .join('\n')
    })
    .then((result) => result.trim());

  return await updateChat(chat.id, {
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

  return await queryChain
    .invoke({
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
    })
    .then((result) => result.trim());
}
