import { createScrollAnchor } from '@/www/hooks/create-scroll-anchor';
import { useChat } from '@/www/hooks/use-chat';
import { Title } from '@solidjs/meta';
import { ChevronDown, ChevronUp, Send } from 'lucide-solid';
import { For, Match, Show, Switch, createComputed, createEffect, on } from 'solid-js';
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
import { H5, H6 } from '../ui/typography';
import { ChatMenu } from './menu';
import { Message } from './message';

export type ChatWindowProps = {
  chatId?: string;
  initInput?: string;
};

export const ChatWindow = (props: ChatWindowProps) => {
  const [chatStore, setChatStore] = useChatStore();

  const {
    input,
    setInput,
    handleSubmit,
    isLoading,
    error,
    chat,
    messages,
    messagesQuery,
    append,
    addToolResult,
    followUpSuggestions,
    followUpSuggestionsQuery,
  } = useChat(() => ({
    id: props.chatId ?? chatStore.chat?.id,
  }));
  createComputed(on(chat, (chat) => setChatStore('chat', chat)));

  createEffect(
    on(
      () => props.initInput,
      (initInput) => {
        setInput(initInput ?? '');
      },
    ),
  );

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
      setMessagesReversed(reconcile(messages.toReversed(), { merge: true }));
    }),
  );

  const { isAtBottom, scrollToBottomSmooth, setScrollRef, setMessagesRef, setVisibilityRef } =
    createScrollAnchor();

  return (
    <div class='relative flex h-full w-full flex-1 flex-col overflow-hidden'>
      <Title>{chatStore.chat?.name ?? 'New Chat'} | The AI Study Bible</Title>
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
          <Switch>
            <Match when={messagesQuery.isFetchingNextPage}>
              <Spinner size='sm' />
            </Match>
            <Match when={messagesQuery.hasNextPage}>
              <div class='flex flex-col items-center justify-center'>
                <Button
                  variant='link'
                  size='icon'
                  class='flex h-fit flex-col items-center justify-center py-4 text-foreground'
                  onClick={() => {
                    if (messagesQuery.hasNextPage && !messagesQuery.isFetchingNextPage) {
                      void messagesQuery.fetchNextPage();
                    }
                  }}
                >
                  <ChevronUp />
                  More
                </Button>
              </div>
            </Match>
          </Switch>
        </div>
        <div ref={setMessagesRef} class='flex flex-1 flex-col-reverse items-center justify-start'>
          <div ref={setVisibilityRef} class='h-5 w-full shrink-0' />
          <Show
            when={
              !isLoading() && !followUpSuggestionsQuery.isFetching && followUpSuggestions.length
            }
          >
            <div class='fade-in zoom-in flex w-full max-w-2xl animate-in flex-col gap-2 pb-2'>
              <H6 class='text-center'>Follow-up Questions</H6>
              <Carousel class='mx-16 overflow-x-visible'>
                <CarouselContent>
                  <For each={followUpSuggestions}>
                    {(suggestion) => (
                      <CarouselItem class='flex justify-center'>
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
          <For
            each={messagesReversed}
            fallback={
              <div class='flex h-full w-full flex-1 items-center justify-center p-20'>
                <H5>No messages yet</H5>
              </div>
            }
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
        <div class='flex w-full max-w-2xl items-center rounded-full border py-2 pr-1 pl-5'>
          <TextField
            class='flex flex-1 items-center'
            value={input()}
            onChange={setInput}
            autoCapitalize='sentences'
          >
            <TextFieldTextArea
              placeholder='Type a message'
              class='flex max-h-24 min-h-[10px] w-full resize-none items-center justify-center border-none bg-transparent p-0 focus-visible:ring-0 focus-visible:ring-transparent focus-visible:ring-offset-0'
              minLength={1}
              autoResize
              autofocus
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
            <Match when={isLoading()}>
              <Spinner size='sm' />
            </Match>
          </Switch>
        </div>
      </form>
    </div>
  );
};
