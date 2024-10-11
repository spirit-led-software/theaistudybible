import { createScrollAnchor } from '@/www/hooks/create-scroll-anchor';
import { useChat } from '@/www/hooks/use-chat';
import { Title } from '@solidjs/meta';
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
import { H5, H6 } from '../ui/typography';
import { ChatMenu } from './menu';
import { Message } from './message';

export type ChatWindowProps = {
  chatId?: string;
  initInput?: string;
};

export const ChatWindow = (props: ChatWindowProps) => {
  const [chatStore, setChatStore] = useChatStore();

  const useChatResult = useChat(() => ({
    id: props.chatId ?? chatStore.chat?.id,
  }));
  createEffect(on(useChatResult.chat, (chat) => setChatStore('chat', chat)));

  createEffect(
    on(
      () => props.initInput,
      (initInput) => {
        useChatResult.setInput(initInput ?? '');
      },
    ),
  );

  createEffect(
    on(useChatResult.error, (error) => {
      if (error) {
        toast.error(error.message);
      }
    }),
  );

  const [messages, setMessages] = createStore(useChatResult.messages());
  createEffect(
    on(useChatResult.messages, (messages) => {
      setMessages(reconcile(messages));
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
          class='-translate-x-1/2 absolute right-1/2 bottom-20 left-1/2 z-40 rounded-full bg-background shadow-lg'
          onClick={scrollToBottomSmooth}
        >
          <ChevronDown />
        </Button>
      </Show>
      <div ref={setScrollRef} class='flex h-full w-full flex-1 flex-col overflow-y-auto'>
        <div class='flex w-full items-end justify-center'>
          <Switch>
            <Match when={useChatResult.messagesQuery.isFetchingNextPage}>
              <Spinner size='sm' />
            </Match>
            <Match when={useChatResult.messagesQuery.hasNextPage}>
              <div class='flex flex-col items-center justify-center'>
                <Button
                  variant='link'
                  size='icon'
                  class='flex h-fit flex-col items-center justify-center py-4 text-foreground'
                  onClick={() => {
                    if (
                      useChatResult.messagesQuery.hasNextPage &&
                      !useChatResult.messagesQuery.isFetchingNextPage
                    ) {
                      void useChatResult.messagesQuery.fetchNextPage();
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
        <div ref={setMessagesRef} class='flex flex-1 flex-col items-center justify-end'>
          <For
            each={messages}
            fallback={
              <div class='flex h-full w-full grow items-center justify-center p-20'>
                <H5>No messages yet</H5>
              </div>
            }
          >
            {(message, idx) => (
              <div data-index={idx()} class='flex w-full max-w-2xl flex-col'>
                <Message
                  previousMessage={useChatResult.messages()[idx() - 1]}
                  message={message}
                  nextMessage={useChatResult.messages()[idx() + 1]}
                  addToolResult={useChatResult.addToolResult}
                  isLoading={useChatResult.isLoading}
                />
              </div>
            )}
          </For>
          <Show
            when={
              !useChatResult.isLoading() &&
              !useChatResult.followUpSuggestionsQuery.isFetching &&
              useChatResult.followUpSuggestions.length
            }
          >
            <div class='fade-in zoom-in flex w-full max-w-2xl animate-in flex-col gap-2 pb-2'>
              <H6 class='text-center'>Follow-up Questions</H6>
              <Carousel class='mx-16 overflow-x-visible'>
                <CarouselContent>
                  <For each={useChatResult.followUpSuggestions}>
                    {(suggestion) => (
                      <CarouselItem class='flex justify-center'>
                        <Button
                          class='mx-2 h-full w-full text-wrap rounded-full'
                          onClick={() =>
                            useChatResult.append({ role: 'user', content: suggestion })
                          }
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
          <div ref={setVisibilityRef} class='h-5 w-full shrink-0' />
        </div>
      </div>
      <form
        class='relative flex w-full flex-col items-center justify-center gap-2 border-t px-2 py-2'
        onSubmit={(e) => {
          e.preventDefault();
          if (!useChatResult.input()) {
            toast.error('Please type a message');
            return;
          }
          useChatResult.handleSubmit(e);
        }}
      >
        <div class='flex w-full max-w-2xl items-center rounded-full border py-2 pr-1 pl-5'>
          <TextField
            class='flex flex-1 items-center'
            value={useChatResult.input()}
            onChange={useChatResult.setInput}
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
                disabled={useChatResult.isLoading()}
              >
                <Send size={20} />
              </Button>
            }
          >
            <Match when={useChatResult.isLoading()}>
              <Spinner size='sm' />
            </Match>
          </Switch>
        </div>
      </form>
    </div>
  );
};
