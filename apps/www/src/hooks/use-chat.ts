import { freeTierModels } from '@/ai/models';
import { registry } from '@/ai/provider-registry';
import { db } from '@/core/database';
import type { Prettify } from '@/core/types/util';
import { createId } from '@/core/utils/id';
import { getValidMessages } from '@/www/server/api/utils/chat';
import type { UseChatOptions } from '@ai-sdk/solid';
import { useChat as useAIChat } from '@ai-sdk/solid';
import { GET } from '@solidjs/start';
import { createInfiniteQuery, createQuery, useQueryClient } from '@tanstack/solid-query';
import { convertToCoreMessages, generateObject } from 'ai';
import { isNull } from 'drizzle-orm';
import type { Accessor } from 'solid-js';
import { createEffect, createMemo, createSignal, mergeProps, on } from 'solid-js';
import { createStore, reconcile } from 'solid-js/store';
import { toast } from 'solid-sonner';
import { z } from 'zod';
import { requireAuth } from '../server/auth';

const getChat = GET(async (chatId?: string) => {
  'use server';
  const { user } = requireAuth();
  if (!chatId) {
    return null;
  }
  const chat = await db.query.chats.findFirst({
    where: (chats, { and, eq }) => and(eq(chats.id, chatId), eq(chats.userId, user.id)),
  });
  return chat ?? null;
});

export const getChatQueryProps = (chatId?: string) => ({
  queryKey: ['chat', { chatId: chatId ?? null }],
  queryFn: () => getChat(chatId),
  enabled: !!chatId,
});

const getChatMessages = GET(
  async ({
    chatId,
    limit,
    offset,
  }: {
    chatId?: string;
    limit: number;
    offset: number;
  }) => {
    'use server';
    const { user } = requireAuth();
    if (!chatId) {
      return {
        messages: [],
        nextCursor: undefined,
      };
    }

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
  queryFn: ({ pageParam }: { pageParam: number }) =>
    getChatMessages({ chatId, limit: 5, offset: pageParam }),
  initialPageParam: 0,
  getNextPageParam: (lastPage: Awaited<ReturnType<typeof getChatMessages>>) => lastPage.nextCursor,
  enabled: !!chatId,
});

const getChatSuggestions = GET(async (chatId?: string) => {
  'use server';
  const { user } = requireAuth();
  if (!chatId) {
    return [];
  }

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
  queryFn: () => getChatSuggestions(chatId),
  enabled: !!chatId,
  staleTime: Number.MAX_SAFE_INTEGER,
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

  const [chatId, setChatId] = createSignal(props()?.id);
  createEffect(() => setChatId(props()?.id));

  const useChatResult = useAIChat(() => ({
    ...props(),
    api: '/api/chat',
    id: chatId(),
    generateId: createId,
    sendExtraMessageFields: true,
    maxToolRoundtrips: 0,
    body: {
      ...props()?.body,
      chatId: chatId(),
    },
    onResponse: (response) => {
      const newChatId = response.headers.get('x-chat-id');
      if (newChatId) {
        setChatId(newChatId);
      }
      return props()?.onResponse?.(response);
    },
    onFinish: (message, options) => {
      Promise.all([
        chatQuery.refetch(),
        messagesQuery.refetch(),
        followUpSuggestionsQuery.refetch(),
        qc.invalidateQueries({ queryKey: ['chats'] }),
        qc.invalidateQueries({ queryKey: ['user-credits'] }),
      ]);
      return props()?.onFinish?.(message, options);
    },
    onError: (err) => {
      console.error(err);
      return props()?.onError?.(err);
    },
  }));

  const chatQuery = createQuery(() => getChatQueryProps(chatId()));
  const chat = createMemo(() =>
    !chatQuery.isLoading && chatQuery.data ? chatQuery.data : undefined,
  );
  createEffect(() => {
    if (!chatQuery.isLoading && chatQuery.error) {
      console.error('Error fetching chat', JSON.stringify(chatQuery.error));
      toast.error(`Error fetching chat: ${chatQuery.error.message}\n\t${chatQuery.error.stack}`);
    }
  });

  const messagesQuery = createInfiniteQuery(() => getChatMessagesQueryProps(chatId()));
  createEffect(() => {
    if (!messagesQuery.isLoading && messagesQuery.data) {
      if (!useChatResult.isLoading()) {
        useChatResult.setMessages(
          messagesQuery.data.pages
            .flatMap((page) => [...page.messages])
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
    }
  });
  createEffect(() => {
    if (!messagesQuery.isLoading && messagesQuery.error) {
      console.error('Error fetching messages', JSON.stringify(messagesQuery.error));
      toast.error(
        `Error fetching messages: ${messagesQuery.error.message}\n\t${messagesQuery.error.stack}`,
      );
    }
  });

  const followUpSuggestionsQuery = createQuery(() => getChatSuggestionsQueryProps(chat()?.id));
  const [followUpSuggestions, setFollowUpSuggestions] = createStore(
    !followUpSuggestionsQuery.isLoading && followUpSuggestionsQuery.data
      ? followUpSuggestionsQuery.data
      : [],
  );
  createEffect(() => {
    if (!followUpSuggestionsQuery.isLoading && followUpSuggestionsQuery.data) {
      setFollowUpSuggestions(reconcile(followUpSuggestionsQuery.data));
    }
  });
  createEffect(() => {
    if (!followUpSuggestionsQuery.isLoading && followUpSuggestionsQuery.error) {
      console.error(
        'Error fetching follow up suggestions',
        JSON.stringify(followUpSuggestionsQuery.error),
      );
      toast.error(
        `Error fetching follow up suggestions: ${followUpSuggestionsQuery.error.message}\n\t${followUpSuggestionsQuery.error.stack}`,
      );
    }
  });

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

  createEffect(
    on(useChatResult.data, (data) => {
      const lastData = data?.at(-1);
      if (lastData && typeof lastData === 'object' && 'lastResponseId' in lastData) {
        useChatResult.setMessages((messages) => [
          ...messages.slice(0, -1),
          {
            ...messages.at(-1)!,
            id: lastData.lastResponseId as string,
          },
        ]);
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
