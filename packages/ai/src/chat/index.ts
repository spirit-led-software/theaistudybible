import type { JwtPayload } from '@clerk/types';
import { db } from '@theaistudybible/core/database';
import {
  chats,
  messages as messagesTable,
  messagesToSourceDocuments
} from '@theaistudybible/core/database/schema';
import { Message } from '@theaistudybible/core/src/model/chat/message';
import { createId } from '@theaistudybible/core/src/util/id';
import { StreamData, convertToCoreMessages, generateObject, streamText } from 'ai';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { defaultModel } from '../models';
import { registry } from '../provider-registry';
import { messagesToString } from '../util';
import { tools } from './tools';

export const renameChat = async (chatId: string, messages: Pick<Message, 'role' | 'content'>[]) => {
  const { object } = await generateObject({
    model: registry.languageModel(`${defaultModel.provider}:${defaultModel.id}`),
    schema: z.object({
      title: z.string().describe('The new title of the chat')
    }),
    system:
      'Given the following conversation, you must generate a new title for the conversation.' +
      ' The new title must be short and descriptive.',
    prompt:
      "Here's the conversation delimited by triple backticks:" +
      '\n```\n' +
      messagesToString(messages) +
      '\n```\n' +
      "What's the new title?"
  });
  return (
    await db
      .update(chats)
      .set({
        name: object.title
      })
      .where(eq(chats.id, chatId))
      .returning()
  ).at(0);
};

export type CreateChatChainOptions = {
  modelId: string;
  chatId: string;
  userMessageId: string;
  userId: string;
  sessionClaims: JwtPayload;
  maxTokens?: number;
};

export const createChatChain = (options: CreateChatChainOptions) => {
  return async (messages: Pick<Message, 'role' | 'content'>[]) => {
    const streamData = new StreamData();
    const responseId = `msg_${createId()}`;

    // @ts-ignore
    messages = convertToCoreMessages(messages);
    // Fix weird issue where some messages are empty
    messages = messages.filter((message) => (message.content?.length ?? 0) > 0);

    console.log('Final messages:', JSON.stringify(messages, null, 2));

    return {
      streamTextResult: await streamText({
        model: registry.languageModel(options.modelId),
        system: `You are an expert on Christian faith and theology. Your goal is to answer questions about the Christian faith.

You must use the vector database tool to fetch relevant resources for your answer. You must only answer the query using these resources. If you don't know the answer, say: "I don't know". Don't make up an answer.

The user's favorite bible translation is ${options.sessionClaims.metadata.bibleTranslation ?? 'WEB'}. Use that translation throughout your conversation unless instructed otherwise by the user.

You must format your response in valid markdown syntax.`,
        // @ts-ignore
        messages,
        tools: tools({ userId: options.userId }),
        maxTokens: options.maxTokens,
        onFinish: async (event) => {
          await db.insert(messagesTable).values({
            id: responseId,
            role: 'assistant',
            content: event.text,
            toolInvocations: event.toolCalls,
            finishReason: event.finishReason,
            data: {
              modelId: options.modelId
            },
            originMessageId: options.userMessageId,
            userId: options.userId,
            chatId: options.chatId
          });

          if (event.toolResults?.length) {
            await db
              .update(messagesTable)
              .set({
                toolInvocations: event.toolResults
              })
              .where(eq(messagesTable.id, responseId));

            for (const toolResult of event.toolResults) {
              if (toolResult.toolName === 'vectorStore') {
                await db
                  .insert(messagesToSourceDocuments)
                  .values(
                    toolResult.result.map((d) => ({
                      messageId: responseId,
                      sourceDocumentId: d.id,
                      distance: 1 - d.score,
                      distanceMetric: 'cosine' as const
                    }))
                  )
                  // In case there are multiple results with the same document
                  .onConflictDoNothing();
              }
            }
          }
        }
      }),
      streamData,
      responseId
    };
  };
};
