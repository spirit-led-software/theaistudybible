import { useBibleStore } from '@/www/contexts/bible';
import { createChatScrollAnchor } from '@/www/hooks/create-chat-scroll-anchor';
import { useChat } from '@/www/hooks/use-chat';
import { useWindowSize } from '@solid-primitives/resize-observer';
import { Meta, Title } from '@solidjs/meta';
import { useLocation, useSearchParams } from '@solidjs/router';
import { ArrowUp, ChevronDown, ChevronUp, StopCircle } from 'lucide-solid';
import { For, Show, createEffect, createMemo, on } from 'solid-js';
import { toast } from 'solid-sonner';
import { useChatStore } from '../../contexts/chat';
import { Button } from '../ui/button';
import { SidebarProvider } from '../ui/sidebar';
import { Spinner } from '../ui/spinner';
import { TextField, TextFieldTextArea } from '../ui/text-field';
import { EmptyWindow } from './empty-window';
import { ChatMenu } from './menu';
import { Message } from './message';
import { SuggestionsMessage } from './message/suggestions';
import { SelectModelButton } from './select-model-button';
import { ChatSidebar } from './sidebar';

export type ChatWindowProps = {
  additionalContext?: string;
};

export const ChatWindow = (props: ChatWindowProps) => {
  const location = useLocation();
  const windowSize = useWindowSize();
  const [chatStore, setChatStore] = useChatStore();
  const [bibleStore] = useBibleStore();

  const {
    id,
    input,
    setInput,
    handleSubmit: handleSubmitBase,
    isLoading,
    error,
    messages,
    messagesQuery,
    append: appendBase,
    stop,
    addToolResult,
    chatQuery,
    followUpSuggestionsQuery,
  } = useChat(() => ({
    id: chatStore.chatId ?? undefined,
    body: {
      additionalContext: props.additionalContext,
      modelId: chatStore.modelId,
      bibleId: bibleStore.bible?.id,
    },
  }));
  createEffect(() => {
    setChatStore('chatId', id() ?? null);
  });
  createEffect(() => {
    if (chatQuery.status === 'success') {
      setChatStore('chat', chatQuery.data.chat);
    }
  });
  createEffect(
    on(error, (error) => {
      if (error) {
        toast.error(error.message);
      }
    }),
  );

  const { isAtBottom, scrollToBottom, setScrollRef, setBottomRef, setTopOfLastMessageRef } =
    createChatScrollAnchor(() => ({ isLoading: isLoading() }));

  const append = (...args: Parameters<typeof appendBase>) => {
    const result = appendBase(...args);
    scrollToBottom();
    return result;
  };

  const handleSubmit = (...args: Parameters<typeof handleSubmitBase>) => {
    args?.[0]?.preventDefault?.();
    if (!input()) {
      toast.error('Please type a message');
      return;
    }
    const result = handleSubmitBase(...args);
    scrollToBottom();
    return result;
  };

  const [searchParams, setSearchParams] = useSearchParams();
  createEffect(
    on(
      () => searchParams?.query,
      (query) => {
        if (query) {
          const messageContent = Array.isArray(query) ? query[0] : query;
          append({ role: 'user', content: messageContent });
          setSearchParams({ query: null });
        }
      },
    ),
  );

  // Find the index of the last message grouped by role
  const lastMessageIdx = createMemo(() => {
    const currentMessages = messages();
    if (currentMessages.length === 0) {
      return 0;
    }

    let idx = currentMessages.length - 1;
    const groupRole = currentMessages[idx]?.role;
    while (idx >= 0 && currentMessages[idx - 1]?.role === groupRole) {
      idx--;
    }
    return idx;
  });

  const isChatPage = createMemo(() => location.pathname.startsWith('/chat'));
  const isMobile = createMemo(() => windowSize.width < 768);

  return (
    <SidebarProvider
      class='min-h-full flex-1 overflow-hidden'
      style={{ '--sidebar-width': '20rem' }}
      defaultOpen={!isMobile() && isChatPage()}
    >
      <Show when={isChatPage()}>
        <MetaTags />
      </Show>
      <ChatSidebar />
      <div class='relative flex w-full flex-1 flex-col overflow-hidden' aria-label='Chat window'>
        <ChatMenu />
        <Show when={!isAtBottom()}>
          <Button
            variant='outline'
            size='icon'
            class='-translate-x-1/2 absolute bottom-20 left-1/2 z-40 rounded-full bg-background shadow-lg'
            onClick={scrollToBottom}
            aria-label='Scroll to bottom of chat'
          >
            <ChevronDown />
          </Button>
        </Show>
        <div
          ref={setScrollRef}
          class='flex w-full flex-1 flex-col overflow-y-auto overflow-x-hidden'
          role='log'
          aria-live='polite'
          aria-label='Chat messages'
        >
          <div class='flex w-full flex-1 flex-col items-center justify-end'>
            <div class='flex w-full items-start justify-center'>
              <Show when={messagesQuery.status === 'success' && messagesQuery.hasNextPage}>
                <div class='flex flex-col items-center justify-center'>
                  <Button
                    variant='link'
                    size='icon'
                    class='flex h-fit flex-col items-center justify-center py-4 text-foreground'
                    disabled={messagesQuery.isFetchingNextPage}
                    onClick={() => messagesQuery.fetchNextPage()}
                    aria-label='Load previous messages'
                  >
                    <Show when={messagesQuery.isFetchingNextPage} fallback={<ChevronUp />}>
                      <Spinner size='sm' />
                    </Show>
                  </Button>
                </div>
              </Show>
            </div>
            <div class='flex w-full flex-1 flex-col items-center justify-end'>
              <For
                each={messages()}
                fallback={
                  <EmptyWindow append={append} additionalContext={props.additionalContext} />
                }
              >
                {(message, idx) => (
                  <>
                    <Show when={idx() === lastMessageIdx()}>
                      <div ref={setTopOfLastMessageRef} class='h-px w-full shrink-0' />
                    </Show>
                    <Message
                      previousMessage={messages()[idx() - 1]}
                      message={message}
                      nextMessage={messages()[idx() + 1]}
                      addToolResult={addToolResult}
                      isLoading={isLoading()}
                    />
                  </>
                )}
              </For>
              <Show
                when={
                  !isLoading() &&
                  !followUpSuggestionsQuery.isFetching &&
                  followUpSuggestionsQuery.data
                }
                keyed
              >
                {({ suggestions }) => (
                  <Show when={suggestions.length}>
                    <SuggestionsMessage suggestions={suggestions} append={append} />
                  </Show>
                )}
              </Show>
            </div>
            <div ref={setBottomRef} class='h-10 w-full shrink-0' />
          </div>
        </div>
        <form
          class='relative flex w-full flex-col items-center justify-center gap-2 px-2 pb-2'
          onSubmit={handleSubmit}
          onKeyDown={(e) => {
            if (windowSize.width < 768) return;
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSubmit(e);
            }
          }}
          aria-label='Message input form'
        >
          <div class='flex h-fit w-full max-w-3xl items-center gap-1 rounded-full border bg-background/80 px-1 py-2 backdrop-blur-md'>
            <SelectModelButton />
            <TextField class='flex flex-1 items-center' value={input()} onChange={setInput}>
              <TextFieldTextArea
                placeholder='Type a message'
                class='flex max-h-24 min-h-fit w-full resize-none items-center justify-center border-none bg-transparent px-2 py-0 placeholder:text-wrap focus-visible:ring-0 focus-visible:ring-transparent focus-visible:ring-offset-0'
                rows={1}
                minlength={1}
                autoResize
                autoCapitalize='sentences'
                aria-label='Message input'
              />
            </TextField>
            <Button
              type='submit'
              size='icon'
              variant='outline'
              class='rounded-full'
              aria-label={isLoading() ? 'Stop generating response' : 'Send message'}
              onClick={() => isLoading() && stop()}
            >
              <Show when={isLoading()} fallback={<ArrowUp size={20} />}>
                <StopCircle size={20} />
              </Show>
            </Button>
          </div>
        </form>
      </div>
    </SidebarProvider>
  );
};

const MetaTags = () => {
  const [chatStore] = useChatStore();
  const chatName = createMemo(() => chatStore.chat?.name ?? 'New Chat');
  const title = createMemo(
    () => `${chatName()} | The AI Study Bible - AI Bible Study Chat Assistant`,
  );
  const description =
    'Engage in meaningful conversations about Scripture with our AI-powered Bible study assistant. Get instant insights, answers, and deeper understanding of biblical passages.';

  return (
    <>
      <Title>{title()}</Title>
      <Meta name='description' content={description} />
      <Meta property='og:title' content={title()} />
      <Meta property='og:description' content={description} />
      <Meta property='og:type' content='website' />
      <Meta name='twitter:card' content='summary' />
      <Meta name='twitter:title' content={title()} />
      <Meta name='twitter:description' content={description} />
    </>
  );
};
