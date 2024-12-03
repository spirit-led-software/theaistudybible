import { freeTierModels } from '@/ai/models';
import { registry } from '@/ai/provider-registry';
import { messagesToString } from '@/ai/utils/messages-to-string';
import { db } from '@/core/database';
import type { Prettify } from '@/core/types/util';
import { createId } from '@/core/utils/id';
import { getValidMessages } from '@/www/server/api/utils/chat';
import type { UseChatOptions } from '@ai-sdk/solid';
import { useChat as useAIChat } from '@ai-sdk/solid';
import { captureException as captureSentryException } from '@sentry/solidstart';
import { createWritableMemo } from '@solid-primitives/memo';
import { GET } from '@solidjs/start';
import { createInfiniteQuery, createQuery, useQueryClient } from '@tanstack/solid-query';
import { Output, generateText } from 'ai';
import { isNull } from 'drizzle-orm';
import { type Accessor, createEffect, mergeProps, on, untrack } from 'solid-js';
import { z } from 'zod';
import { requireAuth } from '../server/auth';

const getChat = GET(async (chatId: string) => {
  'use server';
  const { user } = requireAuth();
  const chat = await db.query.chats.findFirst({
    where: (chats, { and, eq }) => and(eq(chats.id, chatId), eq(chats.userId, user.id)),
  });
  return { chat: chat ?? null };
});

export const getChatQueryProps = (chatId: string) => ({
  queryKey: ['chat', { chatId }],
  queryFn: () => getChat(chatId),
});

const getChatMessages = GET(
  async ({ chatId, limit, offset }: { chatId: string; limit: number; offset: number }) => {
    'use server';
    const { user } = requireAuth();
    const messages = await db.query.messages.findMany({
      where: (messages, { eq, and, or, ne, not }) =>
        and(
          eq(messages.userId, user.id),
          eq(messages.chatId, chatId),
          not(messages.regenerated),
          or(isNull(messages.finishReason), ne(messages.finishReason, 'error')),
        ),
      limit,
      offset,
      orderBy: (messages, { desc }) => desc(messages.createdAt),
    });
    return {
      messages,
      nextCursor: messages.length === limit ? offset + messages.length : undefined,
    };
  },
);

export const getChatMessagesQueryProps = (chatId: string) => ({
  queryKey: ['chat-messages', { chatId }],
  queryFn: ({ pageParam }: { pageParam: number }) =>
    getChatMessages({ chatId, limit: 10, offset: pageParam }),
  getNextPageParam: (lastPage: Awaited<ReturnType<typeof getChatMessages>>) => lastPage.nextCursor,
  initialPageParam: 0,
  keepPreviousData: true,
  placeholderData: { pages: [{ messages: [], nextCursor: undefined }], pageParams: [0] },
});

const getChatSuggestions = GET(async (chatId: string) => {
  'use server';
  const { user } = requireAuth();
  const modelInfo = freeTierModels[0];
  const messages = await getValidMessages({
    chatId,
    userId: user.id,
    maxTokens: modelInfo.contextSize,
  });
  // If there are no messages, don't suggest follow ups
  if (messages.length === 0) {
    return [];
  }

  const {
    experimental_output: { suggestions },
  } = await generateText({
    model: registry.languageModel(`${modelInfo.host}:${modelInfo.id}`),
    experimental_output: Output.object({
      schema: z.object({
        suggestions: z
          .array(
            z
              .string()
              .describe(
                'A follow up question the user may ask given the chat history. Questions must be short and concise.',
              ),
          )
          .length(3),
      }),
    }),
    system: `You must generate a list of follow up questions that the user may ask a chatbot that is an expert on Christian faith and theology, given the messages provided. 

These questions must drive the conversation forward and be thought-provoking.`,
    prompt: `Here's the conversation (delimited by triple dashes):
---
${messagesToString(messages)}
---

What are some follow up questions that the user may ask?`,
  });

  return suggestions;
});

export const getChatSuggestionsQueryProps = (chatId: string) => ({
  queryKey: ['chat-suggestions', { chatId }],
  queryFn: () => getChatSuggestions(chatId),
  staleTime: Number.MAX_SAFE_INTEGER,
});

export type UseChatProps = Prettify<
  Omit<UseChatOptions, 'api' | 'generateId' | 'sendExtraMessageFields' | 'maxToolRoundtrips'>
>;

export const useChat = (props?: Accessor<UseChatProps>) => {
  const qc = useQueryClient();

  const [chatId, setChatId] = createWritableMemo(() => props?.().id ?? createId());

  const useChatResult = useAIChat(() => ({
    ...props?.(),
    api: '/api/chat',
    id: chatId(),
    generateId: createId,
    sendExtraMessageFields: true,
    maxToolRoundtrips: 0,
    body: {
      ...props?.()?.body,
      chatId: chatId(),
    },
    onError: (err) => {
      captureSentryException(err);
      return props?.().onError?.(err);
    },
    onFinish: (event, options) => {
      chatQuery.refetch();
      followUpSuggestionsQuery.refetch();
      qc.invalidateQueries({ queryKey: ['chats'] });
      qc.invalidateQueries({ queryKey: ['user-credits'] });
      props?.().onFinish?.(event, options);
    },
  }));

  createEffect(
    on(useChatResult.data, (streamData) => {
      const lastStreamData = streamData?.at(-1);
      if (
        typeof lastStreamData === 'object' &&
        lastStreamData !== null &&
        !Array.isArray(lastStreamData) &&
        'chatId' in lastStreamData &&
        typeof lastStreamData.chatId === 'string' &&
        lastStreamData.chatId !== chatId()
      ) {
        setChatId(lastStreamData.chatId);
      }
    }),
  );

  const chatQuery = createQuery(() => getChatQueryProps(chatId()));

  const messagesQuery = createInfiniteQuery(() => getChatMessagesQueryProps(chatId()));
  createEffect(() => {
    if (untrack(useChatResult.isLoading)) {
      return;
    }

    if (messagesQuery.status === 'success') {
      useChatResult.setMessages(
        messagesQuery.data.pages
          .flatMap((page) => page.messages)
          .toReversed()
          .map((message) => ({
            ...message,
            createdAt: new Date(message.createdAt),
            content: message.content ?? '',
            annotations: message.annotations ?? undefined,
            toolInvocations: message.toolInvocations ?? undefined,
            tool_call_id: message.tool_call_id ?? undefined,
          })),
      );
    }
  });

  const followUpSuggestionsQuery = createQuery(() => getChatSuggestionsQueryProps(chatId()));

  return mergeProps(useChatResult, {
    id: chatId,
    messagesQuery,
    chatQuery,
    followUpSuggestionsQuery,
  });
};
