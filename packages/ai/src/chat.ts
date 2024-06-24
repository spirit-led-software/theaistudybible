import type { JwtPayload } from '@clerk/types';
import { db } from '@theaistudybible/core/database';
import {
  chats,
  messages as messagesTable,
  messagesToSourceDocuments
} from '@theaistudybible/core/database/schema';
import { Message } from '@theaistudybible/core/src/model/chat/message';
import { createId } from '@theaistudybible/core/src/util/id';
import { convertToCoreMessages, generateObject, streamText } from 'ai';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { defaultModel } from './models';
import { registry } from './provider-registry';
import { messagesToString } from './util';
import { vectorStore } from './vector-store';

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
  chatId: string;
  modelId: string;
  userId: string;
  sessionClaims: JwtPayload;
};

export const createChatChain = (options: CreateChatChainOptions) => {
  return async (messages: Pick<Message, 'role' | 'content'>[]) => {
    const responseId = `msg_${createId()}`;

    //@ts-ignore
    console.log(JSON.stringify(convertToCoreMessages(messages), null, 2));

    return {
      streamTextResult: await streamText({
        model: registry.languageModel(options.modelId),
        system:
          'You are an expert on Christian faith and theology.' +
          ' Your goal is to answer questions about the Christian faith.' +
          ' You must use the vector database tool to fetch relevant resources for your answer.' +
          ` You must only answer the query using these resources.` +
          ` If you don't know the answer, say: "I don't know". Don't make up an answer.` +
          ' If you fetch resources, you must summarize them.',
        // @ts-ignore
        messages: convertToCoreMessages(messages),
        tools: {
          vectorDatabase: {
            parameters: z.object({
              terms: z
                .array(z.string())
                .describe('Search terms or phrases that will be used to find relevant resources.')
                .min(1)
                .max(4)
            }),
            description: 'Fetch relevant resources for your answer.',
            execute: async ({ terms }: { terms: string[] }) => {
              console.log('Vector search terms', terms);
              return (
                await Promise.all(
                  terms.map((term) =>
                    vectorStore.searchDocuments(term, {
                      limit: 4,
                      withMetadata: true
                    })
                  )
                )
              )
                .flat()
                .filter((d, i, a) => a.findIndex((d2) => d2.id === d.id) === i); // remove duplicates
            }
          }
        },
        onFinish: async (event) => {
          await db.insert(messagesTable).values({
            id: responseId,
            content: event.text,
            role: 'assistant',
            finishReason: event.finishReason,
            modelId: options.modelId,
            userId: options.userId,
            chatId: options.chatId,
            toolInvocations: event.toolResults || event.toolCalls
          });
          if (event.toolResults?.length) {
            await db.insert(messagesToSourceDocuments).values(
              event.toolResults
                .map((toolResult) =>
                  toolResult.result.map((d) => ({
                    messageId: responseId,
                    sourceDocumentId: d.id,
                    distance: 1 - d.score,
                    distanceMetric: 'cosine' as const
                  }))
                )
                .flat()
                .filter(
                  (d, i, a) => a.findIndex((d2) => d2.sourceDocumentId === d.sourceDocumentId) === i
                )
            );
          }
        }
      }),
      responseId
    };
  };
};
