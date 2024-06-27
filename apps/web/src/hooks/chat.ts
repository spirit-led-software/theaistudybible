import { UseChatOptions, useChat as useAIChat } from '@ai-sdk/solid';
import { createInfiniteQuery, createQuery } from '@tanstack/solid-query';
import { db } from '@theaistudybible/core/database';
import { Prettify } from '@theaistudybible/core/types/util';
import { createId } from '@theaistudybible/core/util/id';
import { isNull } from 'drizzle-orm';
import { Accessor, createEffect, createSignal, mergeProps, on, splitProps } from 'solid-js';
import { auth } from '~/lib/server/clerk';

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
    where: (messages, { eq, and, or, ne }) =>
      and(
        eq(messages.userId, userId),
        eq(messages.chatId, chatId),
        eq(messages.regenerated, false),
        or(isNull(messages.finishReason), ne(messages.finishReason, 'error'))
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
  | (Omit<
      UseChatOptions,
      'api' | 'id' | 'generateId' | 'sendExtraMessageFields' | 'maxToolRoundtrips'
    > & {
      id?: Accessor<string | undefined>;
      modelId?: Accessor<string | undefined>;
      initQuery?: Accessor<string | undefined>;
      setInitQuery?: (query: string | undefined) => void;
    })
  | undefined
>;

export const useChat = (props: UseChatProps) => {
  const [local, useChatProps] = splitProps(props ?? {}, [
    'id',
    'modelId',
    'initQuery',
    'setInitQuery'
  ]);

  const [lastAiResponseId, setLastAiResponseId] = createSignal<string | undefined>(undefined);

  const [modelId, setModelId] = createSignal<string | undefined>(local.modelId?.());
  createEffect(() => {
    setModelId(local.modelId?.());
  });

  const [chatId, setChatId] = createSignal<string | undefined>(local.id?.());
  createEffect(() => {
    setChatId(local.id?.());
  });

  const useChatResult = useAIChat(() => ({
    ...useChatProps,
    api: '/api/chat',
    id: chatId(),
    generateId: () => `msg_${createId()}`,
    sendExtraMessageFields: true,
    maxToolRoundtrips: 5,
    body: {
      ...useChatProps.body,
      modelId: modelId(),
      chatId: chatId()
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
      return useChatProps.onResponse?.(response);
    },
    onFinish: (message) => {
      chatQuery.refetch();
      messagesQuery.refetch();
      return useChatProps.onFinish?.(message);
    },
    onError: (err) => {
      console.error(err);
      return useChatProps.onError?.(err);
    }
  }));

  const chatQuery = createQuery(() => getChatQueryProps(chatId()));

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
                content: message.content ?? '',
                tool_call_id: message.tool_call_id ?? undefined,
                annotations: message.annotations ?? undefined,
                toolInvocations: message.toolInvocations ?? undefined
              })) ?? []
          );
        }
      }
    )
  );

  createEffect(
    on([useChatResult.isLoading, lastAiResponseId], ([isLoading, lastAiResponseId]) => {
      if (useChatResult.messages() && lastAiResponseId && !isLoading) {
        useChatResult.setMessages([
          ...useChatResult.messages()!.slice(0, -1),
          {
            ...useChatResult.messages()!.at(-1)!,
            id: lastAiResponseId
          }
        ]);
        setLastAiResponseId(undefined);
      }
    })
  );

  createEffect(
    on(props?.initQuery ?? (() => undefined), (query) => {
      if (query) {
        useChatResult.append({
          role: 'user',
          content: query
        });
        local.setInitQuery?.(undefined);
      }
    })
  );

  return mergeProps(useChatResult, {
    chatQuery,
    messagesQuery,
    id: chatId
  });
};
