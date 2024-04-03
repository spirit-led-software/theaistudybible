import { StringOutputParser } from '@langchain/core/output_parsers';
import type { Chat } from '@revelationsai/core/model/chat';
import type { RAIChatMessage } from '@revelationsai/core/model/chat/message';
import type { MessageContent, MessageType } from 'langchain/schema';
import { updateChat } from '../../services/chat';
import { getLanguageModel } from '../llm';
import { getRenameChainPromptInfo } from './prompts';

export async function aiRenameChat(chat: Chat, argMessages: RAIChatMessage[]) {
  if (chat.customName) {
    throw new Error('Chat has already been named by the user');
  }

  let messages = argMessages.slice(-11);
  if (messages.at(-1)?.role === 'user') {
    messages = messages.slice(0, -1);
  }

  const history = messages.map((message) => {
    let role: MessageType;
    if (message.role === 'assistant') {
      role = 'ai';
    } else if (message.role === 'user') {
      role = 'human';
    } else if (message.role === 'data') {
      role = 'generic';
    } else {
      role = message.role;
    }
    return [role, message.content] as [MessageType, MessageContent];
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

  return await updateChat(chat.id, {
    name: result,
    customName: false
  });
}
