import { normalizeMessage } from '@/ai/utils/normalize-message';
import { db } from '@/core/database';
import type { Prettify } from '@/core/types/util';
import { createId } from '@/core/utils/id';
import type { UseChatOptions } from '@ai-sdk/solid';
import { useChat as useAIChat, experimental_useObject as useObject } from '@ai-sdk/solid';
import { captureException as captureSentryException } from '@sentry/solidstart';
import { createWritableMemo } from '@solid-primitives/memo';
import { GET } from '@solidjs/start';
import { createInfiniteQuery, createQuery, useQueryClient } from '@tanstack/solid-query';
import { isNull } from 'drizzle-orm';
import { type Accessor, createEffect, mergeProps, on, untrack } from 'solid-js';
import { chatSuggestionsSchema } from '../server/api/schemas/chat-suggestions';
import { getChatRateLimit } from '../server/api/utils/chat';
import { requireAuth } from '../server/utils/auth';

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
      nextCursor: messages.length === limit ? offset + messages.length : null,
    };
  },
);

export const getChatMessagesQueryProps = (chatId: string) => ({
  queryKey: ['chat-messages', { chatId }],
  queryFn: ({ pageParam }: { pageParam: number }) =>
    getChatMessages({ chatId, limit: 10, offset: pageParam }),
  getNextPageParam: (lastPage: Awaited<ReturnType<typeof getChatMessages>>) => lastPage.nextCursor,
  initialPageParam: 0,
});

export const getRemainingMessages = GET(async () => {
  'use server';
  const { user, roles } = requireAuth();
  const rateLimit = await getChatRateLimit(user, roles);
  const remaining = await rateLimit.getRemaining(user.id);
  return { remaining };
});

export const getRemainingMessagesQueryProps = () => ({
  queryKey: ['remaining-messages'],
  queryFn: () => getRemainingMessages(),
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
      chatSuggestionsResult.submit({ chatId: chatId() });
      remainingMessagesQuery.refetch();
      qc.invalidateQueries({ queryKey: ['chats'] });
      props?.().onFinish?.(event, options);
    },
  }));

  createEffect(
    on(useChatResult.data, (streamData) => {
      const lastStreamData = streamData?.at(-1);
      if (
        typeof lastStreamData === 'object' &&
        lastStreamData !== null &&
        !Array.isArray(lastStreamData)
      ) {
        if (
          'chatId' in lastStreamData &&
          typeof lastStreamData.chatId === 'string' &&
          lastStreamData.chatId !== chatId()
        ) {
          setChatId(lastStreamData.chatId);
        }
      }
    }),
  );

  const chatQuery = createQuery(() => getChatQueryProps(chatId()));

  const messagesQuery = createInfiniteQuery(() => ({
    ...getChatMessagesQueryProps(chatId()),
    placeholderData: (prev) => ({
      pageParams: prev?.pageParams ?? [0],
      pages: prev?.pages ?? [{ messages: [], nextCursor: null }],
    }),
  }));
  createEffect(() => {
    if (
      untrack(useChatResult.status) === 'streaming' ||
      untrack(useChatResult.status) === 'submitted'
    ) {
      return;
    }

    if (messagesQuery.status === 'success') {
      useChatResult.setMessages(
        messagesQuery.data.pages
          .flatMap((page) => page.messages)
          .toReversed()
          .map(normalizeMessage),
      );
    }
  });

  const remainingMessagesQuery = createQuery(() => getRemainingMessagesQueryProps());

  const chatSuggestionsResult = useObject(() => ({
    id: chatId(),
    api: '/api/chat-suggestions',
    schema: chatSuggestionsSchema,
  }));

  return mergeProps(useChatResult, {
    id: chatId,
    messagesQuery,
    chatQuery,
    remainingMessagesQuery,
    chatSuggestionsResult,
  });
};
