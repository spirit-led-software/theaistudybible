import { db } from '@/core/database';
import {
  chats,
  messages as messagesTable,
  messagesToSourceDocuments,
  userGeneratedImagesToSourceDocuments,
} from '@/core/database/schema';
import type { Message } from '@/schemas/chats/messages/types';
import type { DataStreamWriter } from 'ai';
import { Output, generateText, streamText } from 'ai';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { defaultChatModel } from '../models';
import { registry } from '../provider-registry';
import { messagesToString } from '../utils';
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

export type CreateChatChainOptions = Omit<
  Parameters<typeof streamText<ReturnType<typeof tools>>>[0],
  'model' | 'system' | 'messages' | 'tools'
> & {
  modelId: string;
  chatId: string;
  userMessageId: string;
  userId: string;
  dataStream: DataStreamWriter;
  additionalContext?: string | null;
};

export const createChatChain = (options: CreateChatChainOptions) => {
  return (messages: Pick<Message, 'role' | 'content'>[]) => {
    const resolvedTools = tools({ userId: options.userId });
    return streamText({
      ...options,
      model: registry.languageModel(options.modelId),
      system: `You are an expert on Christian faith and theology. Your goal is to answer questions about the Christian faith. You may also be provided with additional context to help you answer the question.

Here are some additional rules for you to follow:
- You are not allowed to use any of your pre-trained knowledge to answer the query.
- You must use the 'Vector Store' tool to fetch relevant information for your answer.
- If you have been provided with additional context, you must use it to answer the question. You can also fetch additional information if necessary.
- You must use the 'Save Context' tool to save additional context (if provided) to the conversation history.
- You must be concise and to the point, unless the user asks for a more verbose answer.
- If you don't know the answer, say: "I don't know" or an equivalent phrase. Do not, for any reason, make up an answer.
- You must format your response in valid markdown syntax.
${
  options.additionalContext
    ? `- You must take into account the following additional context (delimited by triple dashes):
---
${options.additionalContext}
---`
    : ''
}`,
      // @ts-expect-error - Messages are not typed correctly
      messages,
      tools: resolvedTools,
      maxSteps: options.maxSteps ?? 5,
      onStepFinish: async (step) => {
        const [response] = await db
          .insert(messagesTable)
          .values({
            role: 'assistant',
            content: step.text,
            toolInvocations: step.toolCalls?.map((t) => ({
              ...t,
              state: 'execute' in resolvedTools[t.toolName] ? 'call' : 'partial-call',
            })),
            annotations: [{ modelId: options.modelId }],
            finishReason: step.finishReason,
            originMessageId: options.userMessageId,
            userId: options.userId,
            chatId: options.chatId,
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
              if (generateImageToolResult && generateImageToolResult.result.status === 'success') {
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
        return await options.onStepFinish?.(step);
      },
      onFinish: (event) => options.onFinish?.(event),
    });
  };
};
