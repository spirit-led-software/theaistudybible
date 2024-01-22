import type { Chat } from '@core/model/chat';
import { updateChat } from '@services/chat';
import { CHAT_RENAME_CHAIN_PROMPT_TEMPLATE } from '@services/chat/prompts';
import { getLargeContextModel } from '@services/llm';
import type { Message } from 'ai';
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
