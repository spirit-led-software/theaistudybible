import { createScrollAnchor } from '@/www/hooks/create-scroll-anchor';
import { useChat } from '@/www/hooks/use-chat';
import { Meta, Title } from '@solidjs/meta';
import { useSearchParams } from '@solidjs/router';
import { ChevronDown, ChevronUp, Send } from 'lucide-solid';
import { For, Match, Show, Switch, createEffect, on } from 'solid-js';
import { createStore, reconcile } from 'solid-js/store';
import { toast } from 'solid-sonner';
import { useChatStore } from '../../contexts/chat';
import { Button } from '../ui/button';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '../ui/carousel';
import { Spinner } from '../ui/spinner';
import { TextField, TextFieldTextArea } from '../ui/text-field';
import { H6 } from '../ui/typography';
import { EmptyWindow } from './empty-window';
import { ChatMenu } from './menu';
import { Message } from './message';
import { SelectModelButton } from './select-model-button';

export type ChatWindowProps = {
  chatId?: string;
  additionalContext?: string;
};

export const ChatWindow = (props: ChatWindowProps) => {
  const [chatStore, setChatStore] = useChatStore();

  const {
    input,
    setInput,
    handleSubmit,
    isLoading,
    error,
    messages,
    messagesQuery,
    append,
    addToolResult,
    chatQuery,
    followUpSuggestionsQuery,
  } = useChat(() => ({
    id: props.chatId,
    body: {
      additionalContext: props.additionalContext,
      modelId: chatStore.modelId,
    },
  }));

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

  const [messagesReversed, setMessagesReversed] = createStore(messages().toReversed());
  createEffect(
    on(messages, (messages) => {
      setMessagesReversed(reconcile(messages.toReversed()));
    }),
  );

  const { isAtBottom, scrollToBottomSmooth, setScrollRef, setMessagesRef, setVisibilityRef } =
    createScrollAnchor();

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

  return (
    <>
      <MetaTags />
      <div class='relative flex h-full w-full flex-1 flex-col overflow-hidden'>
        <ChatMenu />
        <Show when={!isAtBottom()}>
          <Button
            variant='outline'
            size='icon'
            class='-translate-x-1/2 absolute bottom-20 left-1/2 z-40 rounded-full bg-background shadow-lg'
            onClick={scrollToBottomSmooth}
          >
            <ChevronDown />
          </Button>
        </Show>
        <div ref={setScrollRef} class='flex h-full w-full flex-1 flex-col overflow-y-auto'>
          <div class='flex w-full items-start justify-center'>
            <Show when={messagesQuery.status === 'success' && Boolean(messagesQuery.hasNextPage)}>
              <div class='flex flex-col items-center justify-center'>
                <Button
                  variant='link'
                  size='icon'
                  class='flex h-fit flex-col items-center justify-center py-4 text-foreground'
                  disabled={Boolean(messagesQuery.isFetchingNextPage)}
                  onClick={() => messagesQuery.fetchNextPage()}
                >
                  <Show when={Boolean(messagesQuery.isFetchingNextPage)} fallback={<ChevronUp />}>
                    <Spinner size='sm' />
                  </Show>
                </Button>
              </div>
            </Show>
          </div>
          <div ref={setMessagesRef} class='flex flex-1 flex-col-reverse items-center justify-start'>
            <Show
              when={
                !isLoading() &&
                !followUpSuggestionsQuery.isFetching &&
                followUpSuggestionsQuery.data?.length
              }
            >
              <div class='fade-in zoom-in flex w-full max-w-2xl animate-in flex-col gap-2 pb-2'>
                <H6 class='text-center'>Follow-up Questions</H6>
                <Carousel class='mx-16 overflow-x-visible'>
                  <CarouselContent>
                    <For each={followUpSuggestionsQuery.data}>
                      {(suggestion, idx) => (
                        <CarouselItem data-index={idx()} class='flex justify-center'>
                          <Button
                            class='mx-2 h-full w-full text-wrap rounded-full'
                            onClick={() => append({ role: 'user', content: suggestion })}
                          >
                            {suggestion}
                          </Button>
                        </CarouselItem>
                      )}
                    </For>
                  </CarouselContent>
                  <CarouselPrevious />
                  <CarouselNext />
                </Carousel>
              </div>
            </Show>
            <div ref={setVisibilityRef} class='h-[2px] w-full shrink-0' />
            <For
              each={messagesReversed}
              fallback={<EmptyWindow append={append} additionalContext={props.additionalContext} />}
            >
              {(message, idx) => (
                <div data-index={idx()} class='flex w-full max-w-2xl flex-col'>
                  <Message
                    previousMessage={messagesReversed[idx() + 1]}
                    message={message}
                    nextMessage={messagesReversed[idx() - 1]}
                    addToolResult={addToolResult}
                    isLoading={isLoading}
                  />
                </div>
              )}
            </For>
          </div>
        </div>
        <form
          class='relative flex w-full flex-col items-center justify-center gap-2 border-t px-2 py-2'
          onSubmit={(e) => {
            e.preventDefault();
            if (!input()) {
              toast.error('Please type a message');
              return;
            }
            handleSubmit(e);
          }}
        >
          <div class='flex h-fit w-full max-w-2xl items-center gap-1 rounded-full border px-1 py-2'>
            <SelectModelButton />
            <TextField class='flex flex-1 items-center' value={input()} onChange={setInput}>
              <TextFieldTextArea
                placeholder='Type a message'
                class='flex max-h-24 min-h-fit w-full resize-none items-center justify-center border-none bg-transparent px-2 py-0 focus-visible:ring-0 focus-visible:ring-transparent focus-visible:ring-offset-0'
                rows={1}
                minlength={1}
                autoResize
                autoCapitalize='sentences'
              />
            </TextField>
            <Switch
              fallback={
                <Button
                  type='submit'
                  size='icon'
                  variant='outline'
                  class='rounded-full'
                  disabled={isLoading()}
                >
                  <Send size={20} />
                </Button>
              }
            >
              <Match when={isLoading()} keyed>
                <Spinner size='sm' />
              </Match>
            </Switch>
          </div>
        </form>
      </div>
    </>
  );
};

const MetaTags = () => {
  const [chatStore] = useChatStore();
  const chatName = () => chatStore.chat?.name ?? 'New Chat';
  const title = () => `${chatName()} | The AI Study Bible - AI Bible Study Chat Assistant`;
  const description = () =>
    'Engage in meaningful conversations about Scripture with our AI-powered Bible study assistant. Get instant insights, answers, and deeper understanding of biblical passages.';

  return (
    <>
      <Title>{title()}</Title>
      <Meta name='description' content={description()} />
      <Meta property='og:title' content={title()} />
      <Meta property='og:description' content={description()} />
      <Meta property='og:type' content='website' />
      <Meta name='twitter:card' content='summary' />
      <Meta name='twitter:title' content={title()} />
      <Meta name='twitter:description' content={description()} />
    </>
  );
};
