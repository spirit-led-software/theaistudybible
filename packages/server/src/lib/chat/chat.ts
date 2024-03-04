import { StringOutputParser } from '@langchain/core/output_parsers';
import type { Chat } from '@revelationsai/core/model/chat';
import type { RAIChatMessage } from '@revelationsai/core/model/chat/message';
import { XMLBuilder } from 'fast-xml-parser';
import { PromptTemplate } from 'langchain/prompts';
import { updateChat } from '../../services/chat';
import { getLanguageModel } from '../llm';
import { CHAT_RENAME_CHAIN_PROMPT_TEMPLATE } from './prompts';

export async function aiRenameChat(chat: Chat, history: RAIChatMessage[]) {
  if (chat.customName) {
    throw new Error('Chat has already been named by the user');
  }

  const renameChain = PromptTemplate.fromTemplate(CHAT_RENAME_CHAIN_PROMPT_TEMPLATE)
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
