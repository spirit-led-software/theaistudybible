import { UseChatOptions, useChat as useAIChat } from '@ai-sdk/solid';
import { createInfiniteQuery, createQuery, useQueryClient } from '@tanstack/solid-query';
import { db } from '@theaistudybible/core/database';
import { Prettify } from '@theaistudybible/core/types/util';
import { createId } from '@theaistudybible/core/util/id';
import { isNull } from 'drizzle-orm';
import { Accessor, createEffect, createSignal, mergeProps, on } from 'solid-js';
import { auth } from '~/lib/server/clerk';

const getChat = async (chatId: string) => {
  'use server';
  const { userId } = auth();
  if (!userId) {
    throw new Error('User is not authenticated');
  }
  const chat = await db.query.chats.findFirst({
    where: (chats, { and, eq }) => and(eq(chats.id, chatId), eq(chats.userId, userId))
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
  }
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
  queryKey: ['chat-messages', { chatId: chatId ?? null }],
  queryFn: async ({ pageParam }: { pageParam: number }) => {
    if (chatId) {
      return await getChatMessages({ chatId, limit: 10, offset: pageParam });
    }
    return {
      messages: [],
      nextCursor: undefined
    } satisfies Awaited<ReturnType<typeof getChatMessages>>;
  },
  initialPageParam: 0,
  getNextPageParam: (lastPage: Awaited<ReturnType<typeof getChatMessages>>) => lastPage.nextCursor
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
      return props()?.onResponse?.(response);
    },
    onFinish: (message) => {
      chatQuery.refetch();
      messagesQuery.refetch();
      qc.refetchQueries({
        queryKey: ['chats']
      });
      return props()?.onFinish?.(message);
    },
    onError: (err) => {
      console.error(err);
      return props()?.onError?.(err);
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
    on(
      () => props()?.initQuery,
      (query) => {
        if (query) {
          useChatResult.append({
            role: 'user',
            content: query
          });
          props()?.setInitQuery?.(undefined);
        }
      }
    )
  );

  return mergeProps(useChatResult, {
    chatQuery,
    messagesQuery,
    id: chatId
  });
};
