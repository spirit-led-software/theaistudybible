import type { Bindings, Variables } from '@api/types';
import { messages as messagesTable } from '@core/database/schema';
import type { Message } from '@core/model/chat/message';
import { generateObject, streamText } from 'ai';
import { z } from 'zod';
import { getAnthropic } from '../ai';

const systems = {
  identity: 'A system that answers questions about your identity',
  'chat-history': 'A system that answers questions about the current chat history',
  'faith-qa': 'A system that answers questions about Christian faith and religion'
};

export async function chatChain({
  env,
  vars,
  userId,
  chatId,
  userMessageId,
  aiResponseId,
  modelId,
  messages
}: {
  env: Bindings;
  vars: Variables;
  userId: string;
  chatId: string;
  userMessageId: string;
  aiResponseId: string;
  modelId: string | undefined;
  messages: Partial<Message>[];
}) {
  const { object } = await generateObject({
    model: getAnthropic(env)('claude-3-haiku-20240307'),
    schema: z.object({
      system: z.string().describe('The system to use to respond to the query')
    }),
    system:
      `You are an expert at routing queries to the correct answering system\n` +
      `Given the following messages, what system should be used to respond?\n` +
      `Here are the systems available to use in JSON format with the key being ` +
      `the name of the system and the value being the description of what it is best suited for:\n` +
      JSON.stringify(systems, null, 2),
    // @ts-expect-error - We don't have a good way to type this yet
    messages
  });

  const { system } = object;
  let result: Awaited<ReturnType<typeof streamText>>;
  if (system === 'identity') {
    // Use the identity system
    result = await streamText({
      model: getAnthropic(env)('claude-3-haiku-20240307'),
      system:
        `Your name is ASB and you are an expert in Christian faith and theology\n` +
        `Given the following messages, introduce yourself and give the user a brief summary of your purpose\n` +
        `If the query is unrelated to the Christian faith, encourage the user to ask a different question\n`,
      // @ts-expect-error - We don't have a good way to type this yet
      messages
    });
  } else if (system === 'chat-history') {
    // Use the chat history system
    result = await streamText({
      model: getAnthropic(env)('claude-3-haiku-20240307'),
      system:
        `You are an expert at summarizing the current chat history\n` +
        `Given the following messages, summarize the chat history and provide a brief overview of the current conversation\n` +
        `If the query is unrelated to the current conversation, encourage the user to ask a different question\n`,
      // @ts-expect-error - We don't have a good way to type this yet
      messages
    });
  } else if (system === 'faith-qa') {
    result = await streamText({
      model: getAnthropic(env)('claude-3-haiku-20240307'),
      system:
        `You are an expert at answering questions about Christian faith and religion\n` +
        `Given the following messages, answer the user's question about Christian faith and religion\n` +
        `If the query is unrelated to Christian faith, encourage the user to ask a different question\n`,
      // @ts-expect-error - We don't have a good way to type this yet
      messages
    });
  } else {
    throw new Error(`Unknown system: ${system}`);
  }

  const stream = result.toAIStream({
    async onFinal(completion) {
      await vars.db.insert(messagesTable).values({
        id: aiResponseId,
        role: 'assistant',
        content: completion,
        userId,
        chatId,
        originMessageId: userMessageId,
        metadata: {
          modelId
        }
      });
    }
  });

  return stream;
}
