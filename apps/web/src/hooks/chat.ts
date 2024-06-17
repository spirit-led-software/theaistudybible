import { UseChatOptions, useChat as useAIChat } from '@ai-sdk/solid';
import { db } from '@lib/server/database';
import { createInfiniteQuery, createQuery } from '@tanstack/solid-query';
import { Prettify } from '@theaistudybible/core/types/util';
import { createId } from '@theaistudybible/core/util/id';
import {
  Accessor,
  createComputed,
  createEffect,
  createMemo,
  createSignal,
  splitProps
} from 'solid-js';
import { useAuth } from './clerk';

export const getChatQueryProps = (chatId?: string) => ({
  queryKey: ['chat', { chatId }],
  queryFn: async () => (chatId ? await getChat(chatId) : null)
});

const getChat = async (chatId: string) => {
  'use server';
  return await db.query.chats.findFirst({
    where: (chats, { eq }) => eq(chats.id, chatId)
  });
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
  const messages = await db.query.messages.findMany({
    where: (messages, { eq, and, sql }) =>
      and(
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

export type UseChatProps = Prettify<
  | (Omit<UseChatOptions, 'id' | 'generateId' | 'sendExtraMessageFields'> & {
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
  createComputed(() => {
    setChatId(local.id?.());
  });

  const useChatReturn = useAIChat({
    ...useChatProps,
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
      setTimeout(() => {
        chatQuery.refetch();
        messagesQuery.refetch();
      }, 5 * 1000);
      return useChatProps.onFinish?.(message);
    },
    onError: (err) => {
      console.error(err);
      return useChatProps.onError?.(err);
    }
  });

  const chatQuery = createQuery(() => getChatQueryProps(chatId()));

  const messagesQuery = createInfiniteQuery(() => getChatMessagesQueryProps(chatId()));

  createEffect(() => {
    const newMessages =
      [...(messagesQuery.data?.pages ?? [])]
        .flatMap((page) => [...page.messages])
        .reverse()
        .map((message) => ({
          ...message,
          content: message.content ?? '',
          tool_call_id: message.tool_call_id ?? undefined,
          name: message.name ?? undefined,
          function_call: message.function_call ?? undefined,
          tool_calls: message.tool_calls ?? undefined,
          annotations: message.annotations ?? undefined
        })) ?? [];
    useChatReturn.setMessages(newMessages);
  });

  createEffect(() => {
    const lastAiResponseIdValue = lastAiResponseId();
    const messagesValue = useChatReturn.messages();
    if (messagesValue && lastAiResponseIdValue && !useChatReturn.isLoading()) {
      useChatReturn.setMessages([
        ...messagesValue.slice(0, -1),
        {
          ...messagesValue.at(-1)!,
          id: lastAiResponseIdValue
        }
      ]);
      setLastAiResponseId(undefined);
    }
  });

  const appendQuery = createMemo(() => async (query: string) => {
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
  });

  createEffect(() => {
    const query = props?.initQuery?.();
    if (query) {
      appendQuery()(query);
    }
  });

  return {
    ...useChatReturn,
    chatQuery,
    messagesQuery,
    id: chatId
  };
};
