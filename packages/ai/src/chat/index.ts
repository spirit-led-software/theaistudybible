import { db } from '@/core/database';
import {
  chats,
  messages as messagesTable,
  messagesToSourceDocuments,
  userGeneratedImagesToSourceDocuments,
} from '@/core/database/schema';
import { createId } from '@/core/utils/id';
import type { Bible } from '@/schemas/bibles/types';
import type { Message, ToolInvocationPart } from '@/schemas/chats/messages/types';
import type { Chat } from '@/schemas/chats/types';
import type { Role } from '@/schemas/roles/types';
import type { UserSettings } from '@/schemas/users/types';
import type { User } from '@/schemas/users/types';
import type { DataStreamWriter } from 'ai';
import { Output, appendResponseMessages, generateText, streamText } from 'ai';
import { initLogger, wrapAISDKModel } from 'braintrust';
import { eq } from 'drizzle-orm';
import { Resource } from 'sst';
import { z } from 'zod';
import { type ChatModelInfo, defaultChatModel } from '../models';
import { registry } from '../provider-registry';
import type { DocumentWithScore } from '../types/document';
import { messagesToString, numTokensFromString } from '../utils';
import { getValidMessages } from '../utils/get-valid-messages';
import { normalizeMessage } from '../utils/normalize-message';
import { systemPrompt } from './system-prompt';
import { tools } from './tools';

initLogger({
  projectName: Resource.BrainTrustProjectName.value,
  apiKey: Resource.BrainTrustApiKey.value,
});

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
  roles?: Role[] | null;
  settings?: UserSettings | null;
  dataStream: DataStreamWriter;
  additionalContext?: string | null;
  bible?: Bible;
};

export const createChatChain = async (options: CreateChatChainOptions) => {
  const pendingPromises: Promise<unknown>[] = [];

  const system = systemPrompt({
    additionalContext: options.additionalContext,
    user: options.user,
    settings: options.settings,
    bible: options.bible,
  });
  const systemTokens = numTokensFromString({ text: system });

  console.time('getValidMessages');
  const dbMessages = await getValidMessages({
    userId: options.user.id,
    chatId: options.chat.id,
    maxTokens: options.modelInfo.contextSize - systemTokens - maxResponseTokens,
    mustStartWithUserMessage: options.modelInfo.host === 'anthropic',
  });
  console.timeEnd('getValidMessages');

  const lastUserMessage = dbMessages.find((m) => m.role === 'user')!;

  if (!options.chat.customName) {
    pendingPromises.push(
      renameChat({
        chatId: options.chat.id,
        messages: dbMessages,
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
    user: options.user,
    roles: options.roles,
    bibleAbbreviation: options.bible?.abbreviation,
  });

  // TODO: Uncomment this once bun fixes this issue: https://github.com/oven-sh/bun/issues/13072
  // const model = wrapLanguageModel({
  //   model: registry.languageModel(options.modelId),
  //   middleware: cacheMiddleware,
  // });
  let model = registry.languageModel(`${options.modelInfo.host}:${options.modelInfo.id}`);
  if (Resource.Stage.value === 'production') {
    model = wrapAISDKModel(model);
  }

  const normalizedMessages = dbMessages.map(normalizeMessage);

  return () =>
    streamText({
      ...options,
      model,
      system,
      messages: normalizedMessages,
      tools: resolvedTools,
      maxSteps: options.maxSteps ?? 5,
      experimental_generateMessageId: createId,
      onFinish: async (event) => {
        async function onFinish() {
          const newMessages = appendResponseMessages({
            messages: normalizedMessages,
            responseMessages: event.response.messages,
          }).filter((m) => !normalizedMessages.some((nm) => nm.id === m.id)); // filter out messages that already exist

          for (const message of newMessages) {
            // Remove deprecated fields
            const { toolInvocations, data, ...rest } = message;
            const [response] = await db
              .insert(messagesTable)
              .values({
                ...rest,
                originMessageId: lastUserMessage.id,
                userId: options.user.id,
                chatId: options.chat.id,
              })
              .returning();

            options.dataStream.writeMessageAnnotation({
              dbId: response.id,
            });

            for (const part of message.parts ?? []) {
              if (part.type === 'tool-invocation') {
                if (
                  'result' in part.toolInvocation &&
                  part.toolInvocation.toolName === 'vectorStore' &&
                  part.toolInvocation.result.status === 'success'
                ) {
                  await db
                    .insert(messagesToSourceDocuments)
                    .values(
                      part.toolInvocation.result.documents.map((d: DocumentWithScore) => ({
                        messageId: response.id,
                        sourceDocumentId: d.id,
                        distance: 1 - d.score,
                        distanceMetric: 'cosine' as const,
                      })),
                    )
                    // In case there are multiple results with the same document
                    .onConflictDoNothing();

                  const generateImageToolResult = message.parts?.find(
                    (p) =>
                      p.type === 'tool-invocation' && p.toolInvocation.toolName === 'generateImage',
                  ) as ToolInvocationPart | undefined;
                  if (
                    generateImageToolResult &&
                    'result' in generateImageToolResult.toolInvocation &&
                    generateImageToolResult.toolInvocation.result.status === 'success'
                  ) {
                    const image = generateImageToolResult.toolInvocation.result.image;
                    options.dataStream.writeMessageAnnotation({
                      generatedImageId: image.id,
                    });
                    await db
                      .insert(userGeneratedImagesToSourceDocuments)
                      .values(
                        part.toolInvocation.result.documents.map((d: DocumentWithScore) => ({
                          userGeneratedImageId: image.id,
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
          }
        }

        await Promise.all([...pendingPromises, onFinish(), options.onFinish?.(event)]);
      },
    });
};
