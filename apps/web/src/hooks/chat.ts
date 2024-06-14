import { UseChatOptions, useChat as useAIChat } from '@ai-sdk/solid';
import { db } from '@lib/server/database';
import { createInfiniteQuery } from '@tanstack/solid-query';
import { Prettify } from '@theaistudybible/core/types/util';
import { Accessor, createEffect, createMemo, createSignal, splitProps } from 'solid-js';
import { useAuth } from './clerk';

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
  | (Omit<UseChatOptions, 'id'> & {
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
  const [offset, setOffset] = createSignal(0);

  const [chatId, setChatId] = createSignal<string | undefined>(local.id?.());
  createEffect(() => {
    const id = local.id?.();
    if (chatId() !== id) {
      setChatId(id);
      setOffset(0);
    }
  });

  const useChatReturn = useAIChat({
    ...useChatProps,
    id: chatId(),
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
    onError: (err) => {
      console.error(err);
      return useChatProps.onError?.(err);
    }
  });

  const query = createInfiniteQuery(() => ({
    queryKey: ['chat-messages', { chatId: chatId(), limit: 10, offset: offset() }],
    queryFn: ({ pageParam }) =>
      chatId()
        ? getChatMessages({ chatId: chatId()!, limit: 10, offset: pageParam })
        : { messages: [], nextCursor: undefined },
    initialPageParam: 0,
    getNextPageParam: (lastPage) => lastPage.nextCursor
  }));

  createEffect(() => {
    const newMessages =
      [...(query.data?.pages ?? [])]
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

  createEffect(() => {
    console.log('Messages:', JSON.stringify(useChatReturn.messages(), null, 2));
  });

  return {
    ...useChatReturn,
    query,
    id: chatId,
    setId: setChatId
  };
};
