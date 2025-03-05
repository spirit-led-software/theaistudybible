import { normalizeMessage } from '@/ai/utils/normalize-message';
import { db } from '@/core/database';
import type { Prettify } from '@/core/types/util';
import { createId } from '@/core/utils/id';
import {
  type UseChatOptions,
  useChat as useAIChat,
  experimental_useObject as useObject,
} from '@ai-sdk/react';
import { captureException as captureSentryException } from '@sentry/react';
import { useInfiniteQuery, useQuery, useQueryClient } from '@tanstack/react-query';
import { createServerFn } from '@tanstack/react-start';
import { isNull } from 'drizzle-orm';
import { useEffect, useState } from 'react';
import { z } from 'zod';
import { chatSuggestionsSchema } from '../server/api/schemas/chat-suggestions';
import { requireAuthMiddleware } from '../server/middleware/auth';
import { getChatRateLimit } from '../server/utils/chat';

const getChat = createServerFn({ method: 'GET' })
  .validator(z.object({ chatId: z.string() }))
  .middleware([requireAuthMiddleware])
  .handler(async ({ context, data }) => {
    const chat = await db.query.chats.findFirst({
      where: (chats, { and, eq }) =>
        and(eq(chats.id, data.chatId), eq(chats.userId, context.user.id)),
    });
    return { chat: chat ?? null };
  });

export const getChatQueryProps = (chatId: string) => ({
  queryKey: ['chat', { chatId }],
  queryFn: () => getChat({ data: { chatId } }),
});

// @ts-ignore
const getChatMessages = createServerFn({ method: 'GET' })
  .middleware([requireAuthMiddleware])
  .validator(z.object({ chatId: z.string(), limit: z.number(), offset: z.number() }))
  .handler(async ({ context, data }) => {
    const messages = await db.query.messages.findMany({
      where: (messages, { eq, and, or, ne, not }) =>
        and(
          eq(messages.userId, context.user.id),
          eq(messages.chatId, data.chatId),
          not(messages.regenerated),
          or(isNull(messages.finishReason), ne(messages.finishReason, 'error')),
        ),
      limit: data.limit,
      offset: data.offset,
      orderBy: (messages, { desc }) => desc(messages.createdAt),
    });
    return {
      messages,
      nextCursor: messages.length === data.limit ? data.offset + messages.length : null,
    };
  });

export const getChatMessagesQueryProps = (chatId: string) => ({
  queryKey: ['chat-messages', { chatId }],
  queryFn: ({ pageParam }: { pageParam: number }) =>
    getChatMessages({ data: { chatId, limit: 10, offset: pageParam } }),
  // @ts-ignore
  getNextPageParam: (lastPage: Awaited<ReturnType<typeof getChatMessages>>) => lastPage.nextCursor,
  initialPageParam: 0,
});

export const getRemainingMessages = createServerFn({ method: 'GET' })
  .middleware([requireAuthMiddleware])
  .handler(async ({ context }) => {
    const rateLimit = await getChatRateLimit(context.user, context.roles);
    const remaining = await rateLimit.getRemaining(context.user.id);
    return { remaining };
  });

export const getRemainingMessagesQueryProps = () => ({
  queryKey: ['remaining-messages'],
  queryFn: () => getRemainingMessages(),
});

export type UseChatProps = Prettify<
  Omit<UseChatOptions, 'api' | 'generateId' | 'sendExtraMessageFields' | 'maxToolRoundtrips'>
>;

export const useChat = (props?: UseChatProps) => {
  const qc = useQueryClient();

  const [chatId, setChatId] = useState(() => props?.id ?? createId());
  useEffect(() => {
    setChatId(props?.id ?? createId());
  }, [props?.id]);

  const useChatResult = useAIChat({
    ...props,
    api: '/api/chat',
    id: chatId,
    generateId: createId,
    sendExtraMessageFields: true,
    body: {
      ...props?.body,
      chatId,
    },
    onError: (err) => {
      captureSentryException(err);
      return props?.onError?.(err);
    },
    onFinish: (event, options) => {
      chatQuery.refetch();
      chatSuggestionsResult.submit({ chatId });
      remainingMessagesQuery.refetch();
      qc.invalidateQueries({ queryKey: ['chats'] });
      props?.onFinish?.(event, options);
    },
  });

  useEffect(() => {
    const lastStreamData = useChatResult.data?.at(-1);
    if (
      typeof lastStreamData === 'object' &&
      lastStreamData !== null &&
      !Array.isArray(lastStreamData)
    ) {
      if (
        'chatId' in lastStreamData &&
        typeof lastStreamData.chatId === 'string' &&
        lastStreamData.chatId !== chatId
      ) {
        setChatId(lastStreamData.chatId);
      }
    }
  }, [useChatResult.data, chatId]);

  const chatQuery = useQuery(getChatQueryProps(chatId));

  const messagesQuery = useInfiniteQuery({
    ...getChatMessagesQueryProps(chatId),
    placeholderData: (prev) => ({
      pageParams: prev?.pageParams ?? [0],
      pages: prev?.pages ?? [{ messages: [], nextCursor: null }],
    }),
  });
  useEffect(() => {
    if (useChatResult.status === 'streaming' || useChatResult.status === 'submitted') {
      return;
    }

    if (messagesQuery.status === 'success') {
      useChatResult.setMessages(
        // @ts-ignore
        messagesQuery.data.pages
          .flatMap((page) => page.messages)
          .toReversed()
          .map(normalizeMessage),
      );
    }
  }, [useChatResult.status, useChatResult.setMessages, messagesQuery.status, messagesQuery.data]);

  const remainingMessagesQuery = useQuery(getRemainingMessagesQueryProps());

  const chatSuggestionsResult = useObject({
    id: chatId,
    api: '/api/chat-suggestions',
    schema: chatSuggestionsSchema,
  });

  return {
    ...useChatResult,
    id: chatId,
    messagesQuery,
    chatQuery,
    remainingMessagesQuery,
    chatSuggestionsResult,
  };
};
