import { freeTierModels } from '@/ai/models';
import { registry } from '@/ai/provider-registry';
import { db } from '@/core/database';
import type { Prettify } from '@/core/types/util';
import { createId } from '@/core/utils/id';
import type { Chat } from '@/schemas/chats/types';
import { getValidMessages } from '@/www/server/api/utils/chat';
import type { UseChatOptions } from '@ai-sdk/solid';
import { useChat as useAIChat } from '@ai-sdk/solid';
import { GET } from '@solidjs/start';
import { createInfiniteQuery, createQuery, useQueryClient } from '@tanstack/solid-query';
import { convertToCoreMessages, generateObject } from 'ai';
import { isNull } from 'drizzle-orm';
import type { Accessor } from 'solid-js';
import { createEffect, createSignal, mergeProps, on, untrack } from 'solid-js';
import { createStore, reconcile } from 'solid-js/store';
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

export const getChatQueryProps = (chatId?: string) => ({
  queryKey: ['chat', { chatId: chatId ?? null }],
  queryFn: async () => {
    if (chatId) {
      return await getChat(chatId);
    }
    return { chat: null };
  },
});

const getChatMessages = GET(
  async ({
    chatId,
    limit,
    offset,
  }: {
    chatId: string;
    limit: number;
    offset: number;
  }) => {
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

export const getChatMessagesQueryProps = (chatId?: string) => ({
  queryKey: ['chat-messages', { chatId: chatId ?? null }],
  queryFn: async ({ pageParam }: { pageParam: number }) => {
    if (chatId) {
      return await getChatMessages({ chatId: chatId!, limit: 10, offset: pageParam });
    }
    return { messages: [], nextCursor: undefined };
  },
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
  const { object } = await generateObject({
    model: registry.languageModel(`${modelInfo.provider}:${modelInfo.id}`),
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
    system: `You must generate a list of follow up questions that the user may ask a chatbot that is an expert on Christian faith and theology, given the messages provided. 

These questions must drive the conversation forward and be thought-provoking.`,
    // @ts-expect-error - convertToCoreMessages is not typed
    messages: convertToCoreMessages(messages),
  });
  return object.suggestions;
});

export const getChatSuggestionsQueryProps = (chatId?: string) => ({
  queryKey: ['chat-suggestions', { chatId: chatId ?? null }],
  queryFn: async () => {
    if (chatId) {
      return await getChatSuggestions(chatId);
    }
    return [];
  },
  staleTime: Number.MAX_SAFE_INTEGER,
});

export type UseChatProps = Prettify<
  | (Omit<UseChatOptions, 'api' | 'generateId' | 'sendExtraMessageFields' | 'maxToolRoundtrips'> & {
      initQuery?: string;
      setInitQuery?: (query: string | undefined) => void;
    })
  | undefined
>;

export const useChat = (props?: Accessor<UseChatProps>) => {
  const qc = useQueryClient();

  const [chatId, setChatId] = createSignal(props?.()?.id);
  createEffect(() => setChatId(props?.()?.id));

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
    onResponse: (response) => {
      const newChatId = response.headers.get('x-chat-id');
      if (newChatId) {
        setChatId(newChatId);
      }
      return props?.()?.onResponse?.(response);
    },
    onError: (err) => {
      console.error(err);
      return props?.()?.onError?.(err);
    },
  }));

  const chatQuery = createQuery(() => getChatQueryProps(chatId()));
  const [chat, setChat] = createSignal<Chat | null>(null);
  createEffect(() => {
    if (chatQuery.status === 'success') {
      setChat(chatQuery.data.chat);
    }
  });

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
  const [followUpSuggestions, setFollowUpSuggestions] = createStore<string[]>([]);
  createEffect(() => {
    if (followUpSuggestionsQuery.status === 'success') {
      setFollowUpSuggestions(reconcile(followUpSuggestionsQuery.data));
    }
  });

  createEffect(
    on(
      () => props?.()?.initQuery,
      (query) => {
        if (query) {
          void useChatResult.append({
            role: 'user',
            content: query,
          });
          props?.()?.setInitQuery?.(undefined);
        }
      },
    ),
  );

  createEffect(
    on(useChatResult.data, (data) => {
      const lastData = data?.at(-1);
      if (lastData && typeof lastData === 'object') {
        if ('lastResponseId' in lastData) {
          useChatResult.setMessages((prev) => [
            ...prev.slice(0, -1),
            {
              ...prev.at(-1)!,
              id: lastData.lastResponseId as string,
            },
          ]);
        }

        if ('status' in lastData) {
          if (lastData.status === 'complete') {
            chatQuery.refetch();
            followUpSuggestionsQuery.refetch();
            qc.invalidateQueries({ queryKey: ['chats'] });
            qc.invalidateQueries({ queryKey: ['user-credits'] });
          }
        }
      }
    }),
  );

  return mergeProps(useChatResult, {
    id: chatId,
    messagesQuery,
    chatQuery,
    chat,
    followUpSuggestionsQuery,
    followUpSuggestions,
  });
};
