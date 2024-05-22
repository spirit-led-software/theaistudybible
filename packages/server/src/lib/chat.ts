import type { MessageContent, MessageType } from '@langchain/core/messages';
import { StringOutputParser } from '@langchain/core/output_parsers';
import { chats } from '@theaistudybible/core/database/schema';
import type { Chat } from '@theaistudybible/core/model/chat';
import type { Message } from '@theaistudybible/core/model/chat/message';
import { getLanguageModel } from '@theaistudybible/langchain/lib/llm';
import { getRenameChainPromptInfo } from '@theaistudybible/langchain/lib/prompts/chat';
import { eq } from 'drizzle-orm';
import { db } from './database';

export async function aiRenameChat(
  chat: Chat,
  argMessages: Pick<Message, 'id' | 'role' | 'content'>[]
) {
  if (chat.customName) {
    throw new Error('Chat has already been named by the user');
  }

  let messages = argMessages.slice(-11);
  if (messages.at(-1)?.role === 'user') {
    messages = messages.slice(0, -1);
  }

  const history = messages.map((message) => {
    return [message.role, message.content] as [MessageType, MessageContent];
  });

  const { prompt, stopSequences } = getRenameChainPromptInfo({ history });
  const renameChain = prompt
    .pipe(
      getLanguageModel({
        stopSequences
      })
    )
    .pipe(new StringOutputParser());

  const result = await renameChain.invoke({}).then((result) => result.trim().replace(/"/g, ''));

  return await db
    .update(chats)
    .set({
      name: result,
      customName: false
    })
    .where(eq(chats.id, chat.id));
}
