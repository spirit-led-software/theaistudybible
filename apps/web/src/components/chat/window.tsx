import { createVisibilityObserver } from '@solid-primitives/intersection-observer';
import { ChevronDown, ChevronUp, Send } from 'lucide-solid';
import { For, Match, Show, Switch, createEffect, createSignal, on } from 'solid-js';
import { createStore, reconcile } from 'solid-js/store';
import { useChat } from '~/hooks/use-chat';
import { useChatStore } from '../providers/chat';
import { Button } from '../ui/button';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious
} from '../ui/carousel';
import { Spinner } from '../ui/spinner';
import { TextField, TextFieldTextArea } from '../ui/text-field';
import { showToast } from '../ui/toast';
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
    id: props.chatId ?? chatStore.chat?.id
  }));
  createEffect(
    on(useChatResult.chat, (chat) => {
      setChatStore('chat', chat ?? undefined);
    })
  );

  createEffect(
    on(
      () => props.initInput,
      (initInput) => {
        useChatResult.setInput(initInput ?? '');
      }
    )
  );

  createEffect(
    on(useChatResult.error, (error) => {
      if (error) {
        showToast({ title: error.message, variant: 'error', duration: 3000 });
      }
    })
  );

  const [startOfMessagesRef, setStartOfMessagesRef] = createSignal<HTMLDivElement>();
  const startOfMessagesVisible = createVisibilityObserver()(startOfMessagesRef);

  const [messagesReversed, setMessagesReversed] = createStore(
    useChatResult.messages()?.toReversed() ?? []
  );
  createEffect(
    on(useChatResult.messages, (messages) =>
      setMessagesReversed(reconcile(messages?.toReversed() ?? []))
    )
  );

  return (
    <div class="relative flex h-full flex-col overflow-y-auto">
      <ChatMenu />
      <Show when={!startOfMessagesVisible() && !useChatResult.isLoading()}>
        <Button
          variant="outline"
          size="icon"
          class="absolute bottom-20 left-1/2 right-1/2 -translate-x-1/2 rounded-full bg-background shadow-lg"
          onClick={() => startOfMessagesRef()?.scrollIntoView({ behavior: 'smooth' })}
        >
          <ChevronDown />
        </Button>
      </Show>
      <div class="flex grow flex-col-reverse items-center overflow-y-auto">
        <Show
          when={
            !useChatResult.isLoading() &&
            !useChatResult.followUpSuggestionsQuery.isFetching &&
            useChatResult.followUpSuggestions.length
          }
        >
          <div class="flex w-full max-w-2xl flex-col gap-2 pb-2 animate-in fade-in zoom-in">
            <H6 class="text-center">Follow-up Questions</H6>
            <Carousel class="overflow-x-clip md:overflow-x-visible">
              <CarouselContent>
                <For each={useChatResult.followUpSuggestions}>
                  {(suggestion) => (
                    <CarouselItem class="flex justify-center">
                      <Button
                        class="mx-2 h-full w-full text-wrap rounded-full"
                        onClick={() =>
                          useChatResult.append({
                            role: 'user',
                            content: suggestion
                          })
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
        <div ref={setStartOfMessagesRef} class="h-5 w-full shrink-0" />
        <For
          each={messagesReversed}
          fallback={
            <div class="flex h-full w-full items-center justify-center p-20">
              <H5>No messages yet</H5>
            </div>
          }
        >
          {(message, idx) => (
            <div data-index={idx()} class="flex w-full max-w-2xl flex-col">
              <Message
                previousMessage={messagesReversed[idx() + 1]}
                message={message}
                nextMessage={messagesReversed[idx() - 1]}
                addToolResult={useChatResult.addToolResult}
                isLoading={useChatResult.isLoading()}
              />
            </div>
          )}
        </For>
        <div class="flex w-full items-end justify-center">
          <Switch>
            <Match when={useChatResult.messagesQuery.isFetchingNextPage}>
              <Spinner size="sm" />
            </Match>
            <Match when={useChatResult.messagesQuery.hasNextPage}>
              <div class="flex flex-col items-center justify-center">
                <Button
                  variant="link"
                  size="icon"
                  class="flex h-fit flex-col items-center justify-center py-4"
                  onClick={() => {
                    if (
                      useChatResult.messagesQuery.hasNextPage &&
                      !useChatResult.messagesQuery.isFetchingNextPage
                    ) {
                      useChatResult.messagesQuery.fetchNextPage();
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
      </div>
      <form
        class="relative flex w-full flex-col items-center justify-center gap-2 border-t px-2 py-2"
        onSubmit={async (e) => {
          e.preventDefault();
          if (!useChatResult.input()) {
            showToast({ title: 'Please type a message', variant: 'error', duration: 3000 });
            return;
          }
          useChatResult.handleSubmit(e);
        }}
      >
        <div class="flex w-full max-w-2xl items-center rounded-full border py-2 pl-5 pr-1">
          <TextField
            class="flex flex-1 items-center"
            value={useChatResult.input()}
            onChange={useChatResult.setInput}
            autoCapitalize="sentences"
          >
            <TextFieldTextArea
              placeholder="Type a message"
              class="flex max-h-24 min-h-[20px] w-full resize-none items-center justify-center border-none bg-transparent p-0 focus-visible:ring-0 focus-visible:ring-transparent focus-visible:ring-offset-0"
              autoResize
              autofocus
            />
          </TextField>
          <Switch
            fallback={
              <Button
                type="submit"
                size="icon"
                variant="outline"
                class="rounded-full"
                disabled={useChatResult.isLoading()}
              >
                <Send size={20} />
              </Button>
            }
          >
            <Match when={useChatResult.isLoading()}>
              <Spinner size="sm" />
            </Match>
          </Switch>
        </div>
      </form>
    </div>
  );
};
