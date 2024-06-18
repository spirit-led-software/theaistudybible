import { createVisibilityObserver } from '@solid-primitives/intersection-observer';
import { ChevronDown, ChevronUp, Send } from 'lucide-solid';
import { For, Match, Show, Switch, createEffect, createSignal, on } from 'solid-js';
import { createStore, reconcile } from 'solid-js/store';
import { useChat } from '~/hooks/chat';
import { useAuth } from '~/hooks/clerk';
import { cn } from '~/lib/utils';
import { useChatStore } from '../providers/chat';
import { QueryBoundary } from '../query-boundary';
import { Button } from '../ui/button';
import { Spinner } from '../ui/spinner';
import { TextField, TextFieldTextArea } from '../ui/text-field';
import { showToast } from '../ui/toast';
import { H5 } from '../ui/typography';
import { ChatMenu } from './menu';
import { Message } from './message';

export type ChatWindowProps = {
  chatId?: string;
};

export const ChatWindow = (props: ChatWindowProps) => {
  const { getToken } = useAuth();
  const [, setChatStore] = useChatStore();

  const useChatResult = useChat({
    id: () => props.chatId
  });
  createEffect(
    on(
      () => useChatResult.chatQuery.data,
      (chat) => {
        setChatStore('chat', chat ?? undefined);
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
      setMessagesReversed(reconcile(messages?.toReversed() ?? [], { merge: true }))
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
      <div class="flex grow flex-col-reverse items-center space-y-2 overflow-y-auto border-b">
        <Show
          when={!useChatResult.isLoading()}
          fallback={
            <div class="flex h-full w-full items-center justify-center">
              <Spinner />
            </div>
          }
        >
          <div ref={setStartOfMessagesRef} class="h-10 w-full shrink-0" />
          <QueryBoundary query={useChatResult.messagesQuery}>
            {() => (
              <For
                each={messagesReversed}
                fallback={
                  <div class="flex h-full w-full items-center justify-center">
                    <H5>No messages yet</H5>
                  </div>
                }
              >
                {(message, idx) => (
                  <div
                    data-index={idx()}
                    class={cn(
                      'flex w-full max-w-2xl flex-col',
                      idx() === messagesReversed.length - 1 ? 'border-t-0' : 'border-t'
                    )}
                  >
                    <Message message={message} />
                  </div>
                )}
              </For>
            )}
          </QueryBoundary>
          <div class="flex h-10 w-full shrink-0 items-end justify-center">
            <Switch>
              <Match when={useChatResult.messagesQuery.isFetchingNextPage}>
                <Spinner size="sm" />
              </Match>
              <Match when={useChatResult.messagesQuery.hasNextPage}>
                <div class="flex flex-col items-center justify-center">
                  <Button
                    variant="link"
                    size="icon"
                    class="flex flex-col items-center justify-center"
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
        </Show>
      </div>
      <form
        class="relative flex w-full items-center justify-center px-2 py-2"
        onSubmit={async (e) => {
          e.preventDefault();
          if (!useChatResult.input()) {
            showToast({ title: 'Please type a message', variant: 'error', duration: 3000 });
            return;
          }
          useChatResult.handleSubmit(e, {
            options: {
              body: {
                chatId: useChatResult.id()
              },
              headers: {
                Authorization: `Bearer ${await getToken()()}`
              }
            }
          });
        }}
      >
        <div class="flex w-full max-w-2xl items-center rounded-full border py-2 pl-5 pr-1">
          <TextField class="flex flex-1 items-center">
            <TextFieldTextArea
              placeholder="Type a message"
              value={useChatResult.input()}
              onChange={(e: { currentTarget: HTMLTextAreaElement | undefined }) =>
                useChatResult.setInput(e.currentTarget?.value ?? '')
              }
              class="max-h-24 min-h-[20px] w-full resize-none items-center border-none bg-transparent p-0 focus-visible:ring-0 focus-visible:ring-transparent focus-visible:ring-offset-0"
              autoResize
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
