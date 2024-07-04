import { createVisibilityObserver } from '@solid-primitives/intersection-observer';
import { ChevronDown, ChevronUp, PenBox, Send } from 'lucide-solid';
import { For, Match, Show, Switch, createEffect, createSignal, on } from 'solid-js';
import { createStore, reconcile } from 'solid-js/store';
import { Message } from '~/components/chat/message';
import { useBibleReaderStore } from '~/components/providers/bible-reader';
import { useChatStore } from '~/components/providers/chat';
import { Button } from '~/components/ui/button';
import { CardContent, CardHeader } from '~/components/ui/card';
import { DrawerClose } from '~/components/ui/drawer';
import { Spinner } from '~/components/ui/spinner';
import { TextField, TextFieldTextArea } from '~/components/ui/text-field';
import { showToast } from '~/components/ui/toast';
import { Tooltip, TooltipContent, TooltipTrigger } from '~/components/ui/tooltip';
import { H5 } from '~/components/ui/typography';
import { useChat } from '~/hooks/chat';

export const ChatWindow = () => {
  const [brStore] = useBibleReaderStore();
  const [chatStore, setChatStore] = useChatStore();

  const useChatResult = useChat({
    id: () => chatStore.chat?.id,
    modelId: () => chatStore.modelId
  });
  createEffect(
    on(
      () => useChatResult.chatQuery.data,
      (chat) => {
        setChatStore('chat', chat ?? undefined);
      }
    )
  );

  createEffect(() => {
    if (brStore.selectedText) {
      useChatResult.setInput(
        `Please explain the following passage from ${brStore.selectedTitle}:\n"${brStore.selectedText}"`
      );
    }
  });

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
    <>
      <CardHeader class="flex w-full flex-row items-center justify-between space-x-4 space-y-0">
        <Tooltip>
          <TooltipTrigger
            as={Button}
            variant="ghost"
            onClick={() => {
              setChatStore('chat', undefined);
            }}
          >
            <PenBox size={20} />
          </TooltipTrigger>
          <TooltipContent>New Chat</TooltipContent>
        </Tooltip>
        <DrawerClose as={Button} variant="outline">
          Close
        </DrawerClose>
      </CardHeader>
      <CardContent class="relative flex w-full flex-1 flex-col overflow-y-auto border-t p-0">
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
        <div class="flex grow flex-col-reverse space-y-2 overflow-y-auto border-b">
          <div ref={setStartOfMessagesRef} class="h-5 w-full shrink-0" />
          <For
            each={messagesReversed}
            fallback={
              <div class="flex h-full min-h-52 w-full items-center justify-center">
                <H5>No messages yet</H5>
              </div>
            }
          >
            {(message, idx) => (
              <div class="flex w-full flex-col">
                <Message
                  previousMessage={messagesReversed[idx() + 1]}
                  message={message}
                  addToolResult={useChatResult.addToolResult}
                />
              </div>
            )}
          </For>
          <div class="flex h-5 w-full shrink-0 items-end justify-center">
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
        </div>
        <form
          class="relative flex w-full px-2 py-2"
          onSubmit={async (e) => {
            e.preventDefault();
            if (!useChatResult.input()) {
              showToast({ title: 'Please type a message', variant: 'error', duration: 3000 });
              return;
            }
            useChatResult.handleSubmit(e);
          }}
        >
          <div class="flex w-full items-center rounded-full border py-2 pl-5 pr-1">
            <TextField class="flex flex-1 items-center">
              <TextFieldTextArea
                placeholder="Type a message"
                value={useChatResult.input()}
                onChange={useChatResult.handleInputChange}
                class="max-h-40 min-h-[20px] w-full resize-none border-none bg-transparent p-0 focus-visible:ring-0 focus-visible:ring-transparent focus-visible:ring-offset-0"
                autoResize
              />
            </TextField>
            <Button
              type="submit"
              size="icon"
              variant="outline"
              class="rounded-full"
              disabled={useChatResult.isLoading()}
            >
              <Send size={20} />
            </Button>
          </div>
        </form>
      </CardContent>
    </>
  );
};
