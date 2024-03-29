import { StringOutputParser } from '@langchain/core/output_parsers';
import type { Chat } from '@revelationsai/core/model/chat';
import type { RAIChatMessage } from '@revelationsai/core/model/chat/message';
import { XMLBuilder } from 'fast-xml-parser';
import { ChatPromptTemplate } from 'langchain/prompts';
import type { MessageContent, MessageType } from 'langchain/schema';
import { updateChat } from '../../services/chat';
import { getLanguageModel } from '../llm';
import { CHAT_RENAME_CHAIN_PROMPT_TEMPLATE } from './prompts';

export async function aiRenameChat(chat: Chat, history: RAIChatMessage[]) {
  if (chat.customName) {
    throw new Error('Chat has already been named by the user');
  }

  const messages = history.map((message) => {
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
    return [message.role, message.content] as [MessageType, MessageContent];
  });

  const renameChain = ChatPromptTemplate.fromMessages([
    ['system', CHAT_RENAME_CHAIN_PROMPT_TEMPLATE],
    ...messages,
    ['human', 'What is the title that you would give to this chat?']
  ])
    .pipe(getLanguageModel())
    .pipe(new StringOutputParser());

  const result = await renameChain
    .invoke({
      history: history
        .slice(-21)
        .map((message) =>
          new XMLBuilder().build({ message: { sender: message.role, text: message.content } })
        )
        .join('\n')
    })
    .then((result) => result.trim().replace(/"/g, ''));

  return await updateChat(chat.id, {
    name: result,
    customName: false
  });
}
