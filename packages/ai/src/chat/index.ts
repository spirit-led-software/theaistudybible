import { db } from '@/core/database';
import {
  chats,
  messages as messagesTable,
  messagesToSourceDocuments,
  userGeneratedImagesToSourceDocuments,
} from '@/core/database/schema';
import type { Bible } from '@/schemas/bibles/types';
import type { Message } from '@/schemas/chats/messages/types';
import type { Chat } from '@/schemas/chats/types';
import type { DataStreamWriter } from 'ai';
import { Output, generateText, streamText } from 'ai';
import { eq } from 'drizzle-orm';
import type { User } from 'lucia';
import { z } from 'zod';
import { type ChatModelInfo, defaultChatModel } from '../models';
import { registry } from '../provider-registry';
import { messagesToString, numTokensFromString } from '../utils';
import { getValidMessages } from '../utils/get-valid-messages';
import { systemPrompt } from './system-prompt';
import { tools } from './tools';

export const renameChat = async ({
  chatId,
  messages,
  additionalContext,
}: {
  chatId: string;
  messages: Pick<Message, 'role' | 'content'>[];
  additionalContext?: string | null;
}) => {
  const {
    experimental_output: { title },
  } = await generateText({
    model: registry.languageModel(`${defaultChatModel.host}:${defaultChatModel.id}`),
    experimental_output: Output.object({
      schema: z.object({
        title: z.string().describe('The new title of the chat'),
      }),
    }),
    system: `Given the following conversation, you must generate a new title for the conversation. The new title must be short and descriptive.
Here are some additional rules for you to follow:
- Do not put your title in quotes.
- Your title should be no more than 10 words.
${
  additionalContext
    ? `- You must take into account the following additional context (delimited by triple dashes):
---
${additionalContext}
---`
    : ''
}`,
    prompt: `Here's the conversation (delimited by triple dashes):
---
${messagesToString(messages)}
---

What's the new title?`,
  });

  const [chat] = await db
    .update(chats)
    .set({
      name: title,
    })
    .where(eq(chats.id, chatId))
    .returning();

  return chat;
};

const maxResponseTokens = 4096;

export type CreateChatChainOptions = Omit<
  Parameters<typeof streamText<ReturnType<typeof tools>>>[0],
  'model' | 'system' | 'messages' | 'tools' | 'maxTokens'
> & {
  chat: Chat;
  modelInfo: ChatModelInfo;
  user: User;
  dataStream: DataStreamWriter;
  additionalContext?: string | null;
  bible?: Bible;
};

export const createChatChain = async (options: CreateChatChainOptions) => {
  const pendingPromises: Promise<unknown>[] = [];

  const system = systemPrompt({
    additionalContext: options.additionalContext,
    user: options.user,
    bible: options.bible,
  });
  const systemTokens = numTokensFromString({ text: system });

  console.time('getValidMessages');
  const messages = await getValidMessages({
    userId: options.user.id,
    chatId: options.chat.id,
    maxTokens: options.modelInfo.contextSize - systemTokens - maxResponseTokens,
    mustStartWithUserMessage: options.modelInfo.host === 'anthropic',
  });
  console.timeEnd('getValidMessages');

  const lastUserMessage = messages.find((m) => m.role === 'user')!;

  if (!options.chat.customName) {
    pendingPromises.push(
      renameChat({
        chatId: options.chat.id,
        messages,
        additionalContext: options.additionalContext,
      }),
    );
  } else {
    pendingPromises.push(
      db
        .update(chats)
        .set({ updatedAt: new Date() })
        .where(eq(chats.id, options.chat.id))
        .execute(),
    );
  }

  const resolvedTools = tools({
    dataStream: options.dataStream,
    userId: options.user.id,
    bibleId: options.bible?.id,
  });

  // TODO: Uncomment this once bun fixes this issue: https://github.com/oven-sh/bun/issues/13072
  // const model = wrapLanguageModel({
  //   model: registry.languageModel(options.modelId),
  //   middleware: cacheMiddleware,
  // });
  const model = registry.languageModel(`${options.modelInfo.host}:${options.modelInfo.id}`);
  return () => {
    return streamText({
      ...options,
      model,
      system,
      // @ts-expect-error - Messages are not typed correctly
      messages,
      tools: resolvedTools,
      maxSteps: options.maxSteps ?? 5,
      onStepFinish: async (step) => {
        const onStepFinish = async () => {
          const [response] = await db
            .insert(messagesTable)
            .values({
              role: 'assistant',
              content: step.text,
              toolInvocations: step.toolCalls?.map((t) => ({
                ...t,
                state: 'execute' in resolvedTools[t.toolName] ? 'call' : 'partial-call',
              })),
              annotations: [{ modelId: `${options.modelInfo.host}:${options.modelInfo.id}` }],
              finishReason: step.finishReason,
              originMessageId: lastUserMessage.id,
              userId: options.user.id,
              chatId: options.chat.id,
            })
            .returning();

          options.dataStream.writeMessageAnnotation({
            dbId: response.id,
          });

          if (step.toolResults?.length) {
            await db
              .update(messagesTable)
              .set({
                toolInvocations: step.toolResults.map((t) => ({
                  ...t,
                  state: 'result',
                })),
              })
              .where(eq(messagesTable.id, response.id))
              .returning();

            for (const toolResult of step.toolResults) {
              if (toolResult.toolName === 'vectorStore') {
                await db
                  .insert(messagesToSourceDocuments)
                  .values(
                    toolResult.result.map((d) => ({
                      messageId: response.id,
                      sourceDocumentId: d.id,
                      distance: 1 - d.score,
                      distanceMetric: 'cosine' as const,
                    })),
                  )
                  // In case there are multiple results with the same document
                  .onConflictDoNothing();

                const generateImageToolResult = step.toolResults.find(
                  (t) => t.toolName === 'generateImage',
                );
                if (
                  generateImageToolResult &&
                  generateImageToolResult.result.status === 'success'
                ) {
                  options.dataStream.writeMessageAnnotation({
                    generatedImageId: generateImageToolResult.result.image.id,
                  });
                  await db
                    .insert(userGeneratedImagesToSourceDocuments)
                    .values(
                      toolResult.result.map((d) => ({
                        userGeneratedImageId: generateImageToolResult.result.image!.id,
                        sourceDocumentId: d.id,
                        distance: 1 - d.score,
                        distanceMetric: 'cosine' as const,
                      })),
                    )
                    // In case there are multiple results with the same document
                    .onConflictDoNothing();
                }
              }
            }
          }
        };
        await Promise.all([onStepFinish(), options.onStepFinish?.(step)]);
      },
      onFinish: async (event) => {
        await Promise.all([...pendingPromises, options.onFinish?.(event)]);
      },
    });
  };
};
