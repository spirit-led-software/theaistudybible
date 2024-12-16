import { defaultChatModel } from '@/ai/models';
import { registry } from '@/ai/provider-registry';
import { getValidMessages } from '@/ai/utils/get-valid-messages';
import { messagesToString } from '@/ai/utils/messages-to-string';
import { db } from '@/core/database';
import type { Prettify } from '@/core/types/util';
import { createId } from '@/core/utils/id';
import { type UseChatOptions as BaseUseChatOptions, useChat as useAIChat } from '@ai-sdk/solid';
import { captureException as captureSentryException } from '@sentry/solidstart';
import { createWritableMemo } from '@solid-primitives/memo';
import { makePersisted } from '@solid-primitives/storage';
import { GET } from '@solidjs/start';
import {
  type CreateInfiniteQueryResult,
  type CreateQueryResult,
  type InfiniteData,
  createInfiniteQuery,
  createQuery,
  useQueryClient,
} from '@tanstack/solid-query';
import { Output, generateText } from 'ai';
import { isNull } from 'drizzle-orm';
import type { JSXElement, Setter } from 'solid-js';
import {
  type Accessor,
  createContext,
  createEffect,
  createMemo,
  mergeProps,
  on,
  splitProps,
  untrack,
  useContext,
} from 'solid-js';
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

export const getChatQueryProps = (chatId: string) => ({
  queryKey: ['chat', { chatId }],
  queryFn: () => getChat(chatId),
  placeholderData: { chat: null },
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
      nextCursor: messages.length === limit ? offset + messages.length : undefined,
    };
  },
);

export const getChatMessagesQueryProps = (chatId: string) => ({
  queryKey: ['chat-messages', { chatId }],
  queryFn: ({ pageParam }: { pageParam: number }) =>
    getChatMessages({ chatId, limit: 10, offset: pageParam }),
  getNextPageParam: (lastPage: Awaited<ReturnType<typeof getChatMessages>>) => lastPage.nextCursor,
  initialPageParam: 0,
  keepPreviousData: true,
  placeholderData: { pages: [{ messages: [], nextCursor: undefined }], pageParams: [0] },
});

const getChatSuggestions = GET(async (chatId: string) => {
  'use server';
  const { user } = requireAuth();
  const messages = await getValidMessages({
    chatId,
    userId: user.id,
    maxTokens: defaultChatModel.contextSize,
  });
  // If there are no messages, don't suggest follow ups
  if (messages.length === 0) {
    return [];
  }

  const {
    experimental_output: { suggestions },
  } = await generateText({
    model: registry.languageModel(`${defaultChatModel.host}:${defaultChatModel.id}`),
    experimental_output: Output.object({
      schema: z.object({
        suggestions: z
          .array(
            z
              .string()
              .describe(
                'A follow up question the user may ask given the chat history. Questions must be short and concise.',
              ),
          )
          .describe('A list of 3-6 follow up questions that the user may ask.')
          .min(3)
          .max(6),
      }),
    }),
    system: `You must generate a list of follow up questions that the user may ask a chatbot that is an expert on Christian faith and theology, given the messages provided. 

These questions must drive the conversation forward and be thought-provoking.`,
    prompt: `Here's the conversation (delimited by triple dashes):
---
${messagesToString(messages)}
---

What are some follow up questions that the user may ask?`,
  });

  return suggestions;
});

export const getChatSuggestionsQueryProps = (chatId: string) => ({
  queryKey: ['chat-suggestions', { chatId }],
  queryFn: () => getChatSuggestions(chatId),
  staleTime: Number.MAX_SAFE_INTEGER,
  placeholderData: [],
});

export type ChatContextValue = Prettify<
  ReturnType<typeof useAIChat> & {
    setOptions: Setter<Omit<UseChatOptions, 'id' | 'modelId'>>;
    id: Accessor<string>;
    setId: Setter<string | undefined>;
    modelId: Accessor<string | undefined>;
    setModelId: Setter<string | undefined>;
    chatQuery: CreateQueryResult<Awaited<ReturnType<typeof getChat>>>;
    messagesQuery: CreateInfiniteQueryResult<
      InfiniteData<Awaited<ReturnType<typeof getChatMessages>>>
    >;
    followUpSuggestionsQuery: CreateQueryResult<Awaited<ReturnType<typeof getChatSuggestions>>>;
  }
>;

export const ChatContext = createContext<ChatContextValue>();

export type UseChatOptions = Prettify<
  Omit<
    BaseUseChatOptions,
    'api' | 'generateId' | 'sendExtraMessageFields' | 'maxToolRoundtrips'
  > & {
    modelId?: string;
  }
>;

export type ChatProviderProps = Prettify<
  UseChatOptions & {
    children: JSXElement;
  }
>;

export const ChatProvider = (props: ChatProviderProps) => {
  const [local, others] = splitProps(props, ['id', 'modelId', 'children']);

  const qc = useQueryClient();

  const [options, setOptions] = createWritableMemo(() => others);

  const [_id, setId] = makePersisted(
    createWritableMemo(() => local.id),
    { name: 'chatId' },
  );
  const id = createMemo(() => _id() ?? createId());

  const [modelId, setModelId] = makePersisted(
    createWritableMemo(() => local.modelId),
    { name: 'modelId' },
  );

  const chatQuery = createQuery(() => getChatQueryProps(id()));

  const messagesQuery = createInfiniteQuery(() => getChatMessagesQueryProps(id()));
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

  const followUpSuggestionsQuery = createQuery(() => getChatSuggestionsQueryProps(id()));

  const useChatResult = useAIChat(() => ({
    ...options?.(),
    id: id(),
    api: '/api/chat',
    generateId: createId,
    sendExtraMessageFields: true,
    maxToolRoundtrips: 0,
    body: {
      ...options?.()?.body,
      chatId: id(),
      modelId: modelId(),
    },
    onError: (err) => {
      captureSentryException(err);
      return options?.()?.onError?.(err);
    },
    onFinish: (event, opts) => {
      chatQuery.refetch();
      followUpSuggestionsQuery.refetch();
      qc.invalidateQueries({ queryKey: ['chats'] });
      qc.invalidateQueries({ queryKey: ['user-credits'] });
      return options?.()?.onFinish?.(event, opts);
    },
  }));

  createEffect(
    on(useChatResult.data, (streamData) => {
      const lastStreamData = streamData?.at(-1);
      if (
        typeof lastStreamData === 'object' &&
        lastStreamData !== null &&
        !Array.isArray(lastStreamData) &&
        'chatId' in lastStreamData &&
        typeof lastStreamData.chatId === 'string' &&
        lastStreamData.chatId !== id()
      ) {
        setId(lastStreamData.chatId);
      }
    }),
  );

  return (
    <ChatContext.Provider
      value={mergeProps(useChatResult, {
        id,
        setId,
        modelId,
        setModelId,
        setOptions,
        chatQuery,
        messagesQuery,
        followUpSuggestionsQuery,
      })}
    >
      {local.children}
    </ChatContext.Provider>
  );
};

export type UseChatResult = Prettify<Omit<ChatContextValue, 'setOptions'>>;

export const useChat = (options?: Accessor<UseChatOptions>): UseChatResult => {
  const chatCtx = useContext(ChatContext);
  if (!chatCtx) throw new Error('useChat must be used within a ChatProvider');

  createEffect(
    on(
      () => options?.(),
      (options) => {
        const { id, modelId, ...rest } = options ?? {};
        chatCtx.setId(id);
        chatCtx.setModelId(modelId);
        chatCtx.setOptions(rest);
      },
    ),
  );

  const [, result] = splitProps(chatCtx, ['setOptions']);
  return result;
};
