import { StringOutputParser } from '@langchain/core/output_parsers';
import type { Chat } from '@revelationsai/core/model/chat';
import type { Message } from 'ai';
import { PromptTemplate } from 'langchain/prompts';
import { updateChat } from '../../services/chat';
import { getLanguageModel } from '../../services/llm';
import { CHAT_RENAME_CHAIN_PROMPT_TEMPLATE } from './prompts';

export async function aiRenameChat(chat: Chat, history: Message[]) {
  if (chat.customName) {
    throw new Error('Chat has already been named by the user');
  }

  const renameChain = PromptTemplate.fromTemplate(CHAT_RENAME_CHAIN_PROMPT_TEMPLATE)
    .pipe(
      getLanguageModel({
        stream: false,
        maxTokens: 256,
        promptSuffix: '\nPlace your chat name within <title></title> XML tags.\n<title>',
        stopSequences: ['</title>']
      })
    )
    .pipe(new StringOutputParser());

  const result = await renameChain
    .invoke({
      history: history
        .slice(-13)
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
