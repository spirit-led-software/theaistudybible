import { UseChatOptions, useChat as useAIChat } from '@ai-sdk/solid';
import { db } from '@lib/server/database';
import { createInfiniteQuery, createQuery } from '@tanstack/solid-query';
import { Prettify } from '@theaistudybible/core/types/util';
import { createId } from '@theaistudybible/core/util/id';
import {
  Accessor,
  createEffect,
  createMemo,
  createSignal,
  mergeProps,
  on,
  splitProps
} from 'solid-js';
import { auth } from '~/lib/server/clerk';
import { useAuth } from './clerk';

const getChat = async (chatId: string) => {
  'use server';
  const { userId } = auth();
  if (!userId) {
    throw new Error('User is not authenticated');
  }
  return await db.query.chats.findFirst({
    where: (chats, { and, eq }) => and(eq(chats.id, chatId), eq(chats.userId, userId))
  });
};
export const getChatQueryProps = (chatId?: string) => ({
  queryKey: ['chat', { chatId }],
  queryFn: async () => (chatId ? await getChat(chatId) : null)
});

const getChatMessages = async ({
  chatId,
  limit,
  offset
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
    where: (messages, { eq, and, sql }) =>
      and(
        eq(messages.userId, userId),
        eq(messages.chatId, chatId),
        sql`${messages.metadata}->>'failed' IS NULL OR ${messages.metadata}->>'failed' = 'false'`,
        sql`${messages.metadata}->>'regenerated' IS NULL OR ${messages.metadata}->>'regenerated' = 'false'`
      ),
    limit,
    offset,
    orderBy: (messages, { desc }) => desc(messages.createdAt)
  });

  return {
    messages,
    nextCursor: messages.length === limit ? offset + messages.length : undefined
  };
};

export const getChatMessagesQueryProps = (chatId?: string) => ({
  queryKey: ['chat-messages', { chatId }],
  queryFn: async ({ pageParam }: { pageParam: number }) =>
    chatId
      ? await getChatMessages({ chatId, limit: 10, offset: pageParam })
      : ({ messages: [], nextCursor: undefined } as Awaited<ReturnType<typeof getChatMessages>>),
  initialPageParam: 0,
  getNextPageParam: (lastPage: Awaited<ReturnType<typeof getChatMessages>>) => lastPage.nextCursor
});

export type UseChatProps = Prettify<
  | (Omit<UseChatOptions, 'id' | 'generateId' | 'sendExtraMessageFields' | 'api'> & {
      id?: Accessor<string | undefined>;
      initQuery?: Accessor<string | undefined>;
      setInitQuery?: (query: string | undefined) => void;
    })
  | undefined
>;

export const useChat = (props: UseChatProps) => {
  const [local, useChatProps] = splitProps(props ?? {}, ['id', 'initQuery', 'setInitQuery']);

  const { getToken } = useAuth();
  const [lastAiResponseId, setLastAiResponseId] = createSignal<string | undefined>(undefined);

  const [chatId, setChatId] = createSignal<string | undefined>(local.id?.());
  createEffect(() => {
    setChatId(local.id?.());
  });

  const useChatReturn = useAIChat({
    ...useChatProps,
    api: '/api/chat',
    generateId: createId,
    sendExtraMessageFields: true,
    onResponse: (response) => {
      const newChatId = response.headers.get('x-chat-id');
      if (newChatId) {
        setChatId(newChatId);
      }
      const aiResponseId = response.headers.get('x-ai-response-id');
      if (aiResponseId) {
        setLastAiResponseId(aiResponseId);
      }
      return useChatProps.onResponse?.(response);
    },
    onFinish: (message) => {
      return useChatProps.onFinish?.(message);
    },
    onError: (err) => {
      console.error(err);
      return useChatProps.onError?.(err);
    }
  });

  const chatQuery = createQuery(() => getChatQueryProps(chatId()));

  const messagesQuery = createInfiniteQuery(() => getChatMessagesQueryProps(chatId()));
  createEffect(
    on(
      () => messagesQuery.data,
      (data) => {
        if (!useChatReturn.isLoading()) {
          useChatReturn.setMessages(
            data?.pages
              ?.flatMap((page) => [...page.messages])
              .toReversed()
              .map((message) => ({
                ...message,
                content: message.content ?? '',
                tool_call_id: message.tool_call_id ?? undefined,
                name: message.name ?? undefined,
                function_call: message.function_call ?? undefined,
                tool_calls: message.tool_calls ?? undefined,
                annotations: message.annotations ?? undefined
              })) ?? []
          );
        }
      }
    )
  );

  createEffect(
    on([useChatReturn.isLoading, lastAiResponseId], ([isLoading, lastAiResponseId]) => {
      if (useChatReturn.messages() && lastAiResponseId && !isLoading) {
        useChatReturn.setMessages([
          ...useChatReturn.messages()!.slice(0, -1),
          {
            ...useChatReturn.messages()!.at(-1)!,
            id: lastAiResponseId
          }
        ]);
        setLastAiResponseId(undefined);
      }
    })
  );

  createEffect(
    on(props?.initQuery ?? (() => undefined), async (query) => {
      if (query) {
        useChatReturn.append(
          {
            role: 'user',
            content: query
          },
          {
            options: {
              headers: {
                Authorization: `Bearer ${await getToken()()}`
              }
            }
          }
        );
        local.setInitQuery?.(undefined);
      }
    })
  );

  const isLoading = createMemo(() => messagesQuery.isLoading || useChatReturn.isLoading());

  return mergeProps(useChatReturn, {
    chatQuery,
    messagesQuery,
    id: chatId,
    isLoading
  });
};
