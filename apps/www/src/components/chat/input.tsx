import type { createChatScrollAnchor } from '@/www/hooks/create-chat-scroll-anchor';
import type { useChat } from '@/www/hooks/use-chat';
import { useWindowSize } from '@solid-primitives/resize-observer';
import { ArrowUp, StopCircle } from 'lucide-solid';
import { Show, createMemo } from 'solid-js';
import { toast } from 'solid-sonner';
import { Button } from '../ui/button';
import { TextField, TextFieldTextArea } from '../ui/text-field';
import { SelectModelButton } from './select-model-button';
import { ChatScrollButton } from './scroll-button';

export type ChatInputProps = {
  input: ReturnType<typeof useChat>['input'];
  setInput: ReturnType<typeof useChat>['setInput'];
  handleSubmit: ReturnType<typeof useChat>['handleSubmit'];
  scrollToBottom: ReturnType<typeof createChatScrollAnchor>['scrollToBottom'];
  isLoading: boolean;
  stop: ReturnType<typeof useChat>['stop'];
  isAtBottom: boolean;
};

export const ChatInput = (props: ChatInputProps) => {
  const windowSize = useWindowSize();
  const isMobile = createMemo(() => windowSize.width < 768);

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
      onKeyDown={(e) => {
        if (isMobile()) return;
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          handleSubmit(e);
        }
      }}
      aria-label='Message input form'
    >
      <div class='relative flex h-fit w-full max-w-3xl flex-col gap-2 rounded-t-lg border border-b-none bg-background/80 px-3 pt-2 pb-4 backdrop-blur-md'>
        <Show when={!props.isAtBottom}>
          <ChatScrollButton scrollToBottom={props.scrollToBottom} />
        </Show>
        <div class='flex flex-1 items-center gap-2'>
          <SelectModelButton />
          <TextField
            class='flex flex-1 items-center'
            value={props.input()}
            onChange={props.setInput}
          >
            <TextFieldTextArea
              placeholder={props.isLoading ? 'Generating...' : 'Type a message'}
              class='flex max-h-24 min-h-fit w-full resize-none items-center justify-center border-none bg-transparent px-2 py-0 placeholder:text-wrap focus-visible:ring-0 focus-visible:ring-transparent focus-visible:ring-offset-0'
              rows={1}
              minlength={1}
              autoResize
              autoCapitalize='sentences'
              aria-label='Message input'
            />
          </TextField>
          <Show
            when={!props.isLoading}
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
      </div>
    </form>
  );
};
