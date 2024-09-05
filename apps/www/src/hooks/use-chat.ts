import { freeTierModels } from '@/ai/models';
import { registry } from '@/ai/provider-registry';
import { getValidMessages } from '@/api/utils/chat';
import { db } from '@/core/database';
import type { Prettify } from '@/core/types/util';
import { createId } from '@/core/utils/id';
import type { UseChatOptions} from '@ai-sdk/solid';
import { useChat as useAIChat } from '@ai-sdk/solid';
import { createInfiniteQuery, createQuery, useQueryClient } from '@tanstack/solid-query';
import { convertToCoreMessages, generateObject } from 'ai';
import { auth } from 'clerk-solidjs/server';
import { isNull } from 'drizzle-orm';
import type { Accessor} from 'solid-js';
import { createEffect, createMemo, createSignal, mergeProps, on } from 'solid-js';
import { createStore, reconcile } from 'solid-js/store';
import { z } from 'zod';

const getChat = async (chatId: string) => {
  'use server';
  const { userId } = auth();
  if (!userId) {
    throw new Error('User is not authenticated');
  }
  const chat = await db.query.chats.findFirst({
    where: (chats, { and, eq }) => and(eq(chats.id, chatId), eq(chats.userId, userId)),
  });

  return chat ?? null;
};
export const getChatQueryProps = (chatId?: string) => ({
  queryKey: ['chat', { chatId: chatId ?? null }],
  queryFn: async () => {
    if (chatId) {
      return await getChat(chatId);
    }
    return null;
  },
});

const getChatMessages = async ({
  chatId,
  limit,
  offset,
}: {
  chatId: string;
  limit: number;
  offset: number;
}) => {
  'use server';
  const { userId } = auth();
  if (!userId) {
    throw new Error('User is not authenticated');
  }
  const messages = await db.query.messages.findMany({
    where: (messages, { eq, and, or, ne }) =>
      and(
        eq(messages.userId, userId),
        eq(messages.chatId, chatId),
        eq(messages.regenerated, false),
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
};

export const getChatMessagesQueryProps = (chatId?: string) => ({
  queryKey: ['chat-messages', { chatId: chatId ?? null }],
  queryFn: async ({ pageParam }: { pageParam: number }) => {
    if (chatId) {
      return await getChatMessages({ chatId, limit: 10, offset: pageParam });
    }
    return {
      messages: [],
      nextCursor: undefined,
    } satisfies Awaited<ReturnType<typeof getChatMessages>>;
  },
  initialPageParam: 0,
  getNextPageParam: (lastPage: Awaited<ReturnType<typeof getChatMessages>>) => lastPage.nextCursor,
});

const getChatSuggestions = async (chatId: string) => {
  'use server';
  const { userId } = auth();
  if (!userId) {
    throw new Error('User is not authenticated');
  }

  const modelInfo = freeTierModels[0];
  const messages = await getValidMessages({
    chatId,
    userId,
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
};

export const getChatSuggestionsQueryProps = (chatId?: string) => ({
  queryKey: ['chat-suggestions', { chatId: chatId ?? null }],
  queryFn: async () => {
    if (chatId) {
      return await getChatSuggestions(chatId);
    }
    return [];
  },
});

export type UseChatProps = Prettify<
  | (Omit<UseChatOptions, 'api' | 'generateId' | 'sendExtraMessageFields' | 'maxToolRoundtrips'> & {
      initQuery?: string;
      setInitQuery?: (query: string | undefined) => void;
    })
  | undefined
>;

export const useChat = (props: Accessor<UseChatProps>) => {
  const qc = useQueryClient();

  const [chatId, setChatId] = createSignal<string | undefined>(props()?.id);
  createEffect(() => {
    setChatId(props()?.id);
  });

  const [lastAiResponseId, setLastAiResponseId] = createSignal<string | undefined>(undefined);

  const useChatResult = useAIChat(() => ({
    ...props(),
    api: '/api/chat',
    id: chatId(),
    generateId: () => `msg_${createId()}`,
    sendExtraMessageFields: true,
    maxToolRoundtrips: 5,
    body: {
      ...props()?.body,
      chatId: chatId(),
    },
    onResponse: (response) => {
      const newChatId = response.headers.get('x-chat-id');
      if (newChatId) {
        setChatId(newChatId);
      }
      const aiResponseId = response.headers.get('x-response-id');
      if (aiResponseId) {
        setLastAiResponseId(aiResponseId);
      }
      return props()?.onResponse?.(response);
    },
    onFinish: (message, options) => {
      void chatQuery.refetch();
      void messagesQuery.refetch();
      void followUpSuggestionsQuery.refetch();
      void qc.refetchQueries({
        queryKey: ['chats'],
      });
      return props()?.onFinish?.(message, options);
    },
    onError: (err) => {
      console.error(err);
      return props()?.onError?.(err);
    },
  }));

  const chatQuery = createQuery(() => getChatQueryProps(chatId()));
  const chat = createMemo(() => chatQuery.data);

  const messagesQuery = createInfiniteQuery(() => getChatMessagesQueryProps(chatId()));
  createEffect(
    on(
      () => messagesQuery.data,
      (data) => {
        if (!useChatResult.isLoading()) {
          useChatResult.setMessages(
            data?.pages
              ?.flatMap((page) => [...page.messages])
              .toReversed()
              .map((message) => ({
                ...message,
                createdAt: new Date(message.createdAt),
                content: message.content ?? '',
                tool_call_id: message.tool_call_id ?? undefined,
                annotations: message.annotations ?? undefined,
                toolInvocations: message.toolInvocations ?? undefined,
              })) ?? [],
          );
        }
      },
    ),
  );

  const followUpSuggestionsQuery = createQuery(() => ({
    ...getChatSuggestionsQueryProps(chatId()),
    // Reduce LLM calls by setting this as never stale
    gcTime: Infinity,
    staleTime: Infinity,
  }));
  const [followUpSuggestions, setFollowUpSuggestions] = createStore(
    followUpSuggestionsQuery.data ?? [],
  );
  createEffect(() => {
    setFollowUpSuggestions(reconcile(followUpSuggestionsQuery.data ?? []));
  });

  createEffect(
    on([useChatResult.isLoading, lastAiResponseId], ([isLoading, lastAiResponseId]) => {
      if (useChatResult.messages() && lastAiResponseId && !isLoading) {
        useChatResult.setMessages([
          ...useChatResult.messages().slice(0, -1),
          {
            ...useChatResult.messages().at(-1)!,
            id: lastAiResponseId,
          },
        ]);
        setLastAiResponseId(undefined);
      }
    }),
  );

  createEffect(
    on(
      () => props()?.initQuery,
      (query) => {
        if (query) {
          void useChatResult.append({
            role: 'user',
            content: query,
          });
          props()?.setInitQuery?.(undefined);
        }
      },
    ),
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
