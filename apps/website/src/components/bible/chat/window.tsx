import { db } from '@lib/server/database';
import { createId } from '@paralleldrive/cuid2';
import { createInfiniteQuery } from '@tanstack/solid-query';
import { useChat } from 'ai/solid';
import { ChevronDown, Send } from 'lucide-solid';
import { createEffect, createMemo, createSignal } from 'solid-js';
import { SignInButton, SignedIn, SignedOut } from '~/components/clerk';
import { Separator } from '~/components/ui/separator';
import { useAuth } from '~/hooks/clerk';
import { bibleStore, setBibleStore } from '~/lib/stores/bible';
import { chatStore, setChatStore } from '~/lib/stores/chat';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { H3, P } from '../../ui/typography';
import MessageUI from './message';

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
    nextCursor: messages.length ? offset + messages.length : undefined
  };
};

export default function ChatWindow() {
  const { getToken } = useAuth();
  const [lastAiResponseId, setLastAiResponseId] = createSignal<string | undefined>(undefined);
  const [offset, setOffset] = createSignal(0);

  const query = createInfiniteQuery(() => ({
    queryKey: ['chat-messages', { chatId: chatStore.chatId, limit: 10, offset: offset() }],
    queryFn: ({ pageParam }) =>
      chatStore.chatId
        ? getChatMessages({ chatId: chatStore.chatId, limit: 10, offset: pageParam })
        : { messages: [], nextCursor: undefined },
    initialPageParam: 0,
    getNextPageParam: (lastPage) => lastPage.nextCursor
  }));
  createEffect(() => {
    if (query.data) {
      setMessages(
        query.data.pages
          .flatMap((page) => page.messages)
          .map((message) => ({
            ...message,
            content: message.content ?? '',
            tool_call_id: message.tool_call_id ?? undefined,
            name: message.name ?? undefined,
            function_call: message.function_call ?? undefined,
            tool_calls: message.tool_calls ?? undefined,
            annotations: message.annotations ?? undefined
          }))
      );
    }
  });

  const { input, setInput, handleSubmit, messages, setMessages, error, isLoading, append } =
    useChat({
      api: '/api/chat',
      id: chatStore.chatId,
      generateId: createId,
      sendExtraMessageFields: true,
      onResponse(response) {
        const newChatId = response.headers.get('x-chat-id');
        if (newChatId) {
          setChatStore('chatId', newChatId);
        }
        const aiResponseId = response.headers.get('x-ai-response-id');
        if (aiResponseId) {
          setLastAiResponseId(aiResponseId);
        }
      },
      onError: (err) => {
        console.error(err);
      }
    });

  const [alert, setAlert] = createSignal<string | undefined>(undefined);

  createEffect(() => {
    const lastAiResponseIdValue = lastAiResponseId();
    const messagesValue = messages();
    if (messagesValue && lastAiResponseIdValue && !isLoading()) {
      setMessages([
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
    append(
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
    setChatStore('query', undefined);
  });

  createEffect(() => {
    if (chatStore.query) {
      appendQuery()(chatStore.query);
    }
  });

  createEffect(() => {
    const errorValue = error();
    if (errorValue) {
      setAlert(errorValue.message);
    }
  }, [error]);

  createEffect(() => {
    const alertValue = alert();
    if (alertValue) {
      setTimeout(() => {
        setAlert(undefined);
      }, 5000);
    }
  });

  return (
    <div
      class={`fixed bottom-0 left-12 right-12 z-40 flex flex-col overflow-hidden rounded-t-lg border bg-background shadow-xl duration-200 md:left-1/4 md:right-1/4 xl:left-1/3 xl:right-1/3 ${bibleStore.chatOpen ? 'h-2/3 delay-200' : 'h-0'}`}
    >
      <div class="flex w-full place-items-center justify-between bg-primary px-1 py-2">
        <H3 class="px-2 text-primary-foreground">Chat</H3>
        <Button
          variant={'ghost'}
          onClick={() => setBibleStore('chatOpen', !open)}
          class="px-2 text-primary-foreground"
        >
          <ChevronDown size={20} />
        </Button>
      </div>
      <SignedIn>
        <div class="relative flex-1 flex-col-reverse space-y-2 overflow-y-auto whitespace-pre-wrap">
          {messages()?.map((message) => (
            <div class="flex w-full flex-col">
              <Separator orientation="horizontal" class="w-full" />
              <MessageUI message={message} />
            </div>
          ))}
        </div>
        <form
          class="relative flex w-full px-2 py-2"
          onSubmit={async (e) => {
            e.preventDefault();
            if (!input) {
              setAlert('Please type a message');
              return;
            }
            handleSubmit(e, {
              options: {
                headers: {
                  Authorization: `Bearer ${await getToken()()}`
                }
              }
            });
          }}
        >
          {alert() && (
            <div class="absolute -top-10 left-1 right-1 z-50 mx-auto my-1 flex max-h-24 place-items-center justify-center overflow-clip">
              <p class="truncate rounded-xl bg-destructive p-2 text-destructive-foreground">
                {alert()}
              </p>
            </div>
          )}
          <Input
            placeholder="Type a message"
            value={input()}
            onChange={(e) => setInput(e.currentTarget?.value ?? '')}
            class="rounded-r-none"
          />
          <Button type="submit" class="rounded-l-none">
            <Send size={20} />
          </Button>
        </form>
      </SignedIn>
      <SignedOut>
        <div class="flex h-full w-full flex-col place-items-center justify-center">
          <P>
            Please{' '}
            <Button
              variant={'link'}
              class="px-0 capitalize text-accent-foreground"
              disabled={isLoading()}
              as={SignInButton}
            />
            to chat
          </P>
        </div>
      </SignedOut>
    </div>
  );
}
