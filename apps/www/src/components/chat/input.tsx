import type { createChatScrollAnchor } from '@/www/hooks/create-chat-scroll-anchor';
import type { useChat } from '@/www/hooks/use-chat';
import type { chatSuggestionsSchema } from '@/www/server/api/schemas/chat-suggestions';
import { createAutoAnimate } from '@formkit/auto-animate/solid';
import { useWindowSize } from '@solid-primitives/resize-observer';
import { ArrowUp, StopCircle } from 'lucide-solid';
import { type Accessor, For, Show, createMemo } from 'solid-js';
import { toast } from 'solid-sonner';
import type { z } from 'zod';
import { Button } from '../ui/button';
import { TextField, TextFieldTextArea } from '../ui/text-field';
import { RemainingMessages } from './remaining-messages';
import { ChatScrollButton } from './scroll-button';
import { SelectModelButton } from './select-model-button';

export type ChatInputProps = {
  input: ReturnType<typeof useChat>['input'];
  setInput: ReturnType<typeof useChat>['setInput'];
  handleSubmit: ReturnType<typeof useChat>['handleSubmit'];
  append: ReturnType<typeof useChat>['append'];
  scrollToBottom: ReturnType<typeof createChatScrollAnchor>['scrollToBottom'];
  isLoading: Accessor<boolean>;
  stop: ReturnType<typeof useChat>['stop'];
  isAtBottom: Accessor<boolean>;
  remainingMessagesQuery: ReturnType<typeof useChat>['remainingMessagesQuery'];
  chatSuggestionsResult: ReturnType<typeof useChat>['chatSuggestionsResult'];
};

export const ChatInput = (props: ChatInputProps) => {
  const windowSize = useWindowSize();
  const isMobile = createMemo(() => windowSize.width < 768);

  const [suggestionsContainer] = createAutoAnimate();
  const [suggestionsList] = createAutoAnimate();

  const handleSubmit = (...args: Parameters<typeof props.handleSubmit>) => {
    args?.[0]?.preventDefault?.();
    if (!props.input()) {
      toast.error('Please type a message');
      return;
    }
    const result = props.handleSubmit(...args);
    props.scrollToBottom();
    return result;
  };

  return (
    <form
      class='absolute inset-x-0 bottom-0 flex w-full flex-col items-center justify-center gap-1 px-2'
      onSubmit={handleSubmit}
      aria-label='Message input form'
    >
      <div ref={suggestionsContainer} class='w-full overflow-hidden'>
        <Show when={props.isAtBottom()}>
          <div
            ref={suggestionsList}
            class='mx-auto flex w-full max-w-3xl gap-2 overflow-x-auto pb-2'
          >
            <For each={props.chatSuggestionsResult.object()?.suggestions ?? []}>
              {(suggestion) => (
                <Show
                  when={suggestion as z.infer<typeof chatSuggestionsSchema>['suggestions'][number]}
                  keyed
                >
                  {(suggestion) => (
                    <Button
                      variant='outline'
                      class='shrink-0 whitespace-nowrap bg-background'
                      disabled={props.chatSuggestionsResult.isLoading()}
                      onClick={() => props.append({ role: 'user', content: suggestion.long })}
                    >
                      {suggestion.short}
                    </Button>
                  )}
                </Show>
              )}
            </For>
          </div>
        </Show>
      </div>
      <div class='relative flex h-fit w-full max-w-3xl flex-col gap-2 rounded-t-lg border border-b-none bg-background/80 px-3 pt-2 pb-4 backdrop-blur-md'>
        <Show when={!props.isAtBottom()}>
          <ChatScrollButton scrollToBottom={props.scrollToBottom} />
        </Show>
        <div class='flex flex-1 items-center gap-2'>
          <SelectModelButton />
          <TextField
            class='flex flex-1 items-center'
            value={props.input()}
            onChange={props.setInput}
            onKeyDown={(e) => {
              if (isMobile()) return;
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e);
              }
            }}
          >
            <TextFieldTextArea
              placeholder={props.isLoading() ? 'Generating...' : 'Type a message'}
              class='flex max-h-24 min-h-fit w-full resize-none items-center justify-center border-none bg-transparent px-2 py-0 placeholder:text-wrap focus-visible:ring-0 focus-visible:ring-transparent focus-visible:ring-offset-0'
              rows={1}
              minlength={1}
              autoResize
              autoCapitalize='sentences'
              aria-label='Message input'
            />
          </TextField>
          <Show
            when={!props.isLoading()}
            fallback={
              <Button
                type='button'
                size='icon'
                variant='outline'
                class='rounded-full'
                aria-label='Stop generating response'
                onClick={() => props.stop()}
              >
                <StopCircle size={20} />
              </Button>
            }
          >
            <Button
              type='submit'
              size='icon'
              variant='outline'
              class='rounded-full'
              aria-label='Send message'
            >
              <ArrowUp size={20} />
            </Button>
          </Show>
        </div>
        <RemainingMessages remainingMessagesQuery={props.remainingMessagesQuery} />
      </div>
    </form>
  );
};
