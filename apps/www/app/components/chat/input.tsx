import type { useChat } from '@/www/hooks/use-chat';
import type { useChatScrollAnchor } from '@/www/hooks/use-chat-scroll-anchor';
import type { chatSuggestionsSchema } from '@/www/server/api/schemas/chat-suggestions';
import { useAutoAnimate } from '@formkit/auto-animate/react';
import { useWindowSize } from '@uidotdev/usehooks';
import { ArrowUp, StopCircle } from 'lucide-react';
import { useMemo } from 'react';
import { toast } from 'sonner';
import type { z } from 'zod';
import { Button } from '../ui/button';
import { Textarea } from '../ui/textarea';
import { RemainingMessages } from './remaining-messages';
import { ChatScrollButton } from './scroll-button';
import { SelectModelButton } from './select-model-button';

export type ChatInputProps = {
  input: ReturnType<typeof useChat>['input'];
  handleInputChange: ReturnType<typeof useChat>['handleInputChange'];
  handleSubmit: ReturnType<typeof useChat>['handleSubmit'];
  append: ReturnType<typeof useChat>['append'];
  scrollToBottom: ReturnType<typeof useChatScrollAnchor>['scrollToBottom'];
  isLoading: boolean;
  stop: ReturnType<typeof useChat>['stop'];
  isAtBottom: boolean;
  remainingMessagesQuery: ReturnType<typeof useChat>['remainingMessagesQuery'];
  chatSuggestionsResult: ReturnType<typeof useChat>['chatSuggestionsResult'];
};

export const ChatInput = (props: ChatInputProps) => {
  const { width } = useWindowSize();
  const isMobile = useMemo(() => (width ?? 0) < 768, [width]);

  const [suggestionsContainer] = useAutoAnimate();
  const [suggestionsList] = useAutoAnimate();

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
      className='absolute inset-x-0 bottom-0 flex w-full flex-col items-center justify-center gap-1 px-2'
      onSubmit={handleSubmit}
      aria-label='Message input form'
    >
      <div ref={suggestionsContainer} className='w-full overflow-hidden'>
        {props.isAtBottom && (
          <div
            ref={suggestionsList}
            className='mx-auto flex w-full max-w-3xl gap-2 overflow-x-auto pb-2'
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
                      className='shrink-0 whitespace-nowrap bg-background'
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
        )}
      </div>
      <div className='relative flex h-fit w-full max-w-3xl flex-col gap-2 rounded-t-lg border border-b-none bg-background/80 px-3 pt-2 pb-4 backdrop-blur-md'>
        {props.isAtBottom && <ChatScrollButton scrollToBottom={props.scrollToBottom} />}
        <div className='flex flex-1 items-center gap-2'>
          <SelectModelButton />
          <div
            className='flex flex-1 items-center'
            onKeyDown={(e) => {
              if (isMobile) return;
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e);
              }
            }}
          >
            <Textarea
              value={props.input}
              onChange={props.handleInputChange}
              placeholder={props.isLoading ? 'Generating...' : 'Type a message'}
              className='flex max-h-24 min-h-fit w-full resize-none items-center justify-center border-none bg-transparent px-2 py-0 placeholder:text-wrap focus-visible:ring-0 focus-visible:ring-transparent focus-visible:ring-offset-0'
              rows={1}
              minLength={1}
              autoCapitalize='sentences'
              aria-label='Message input'
            />
          </div>
          {props.isLoading ? (
            <Button
              type='button'
              size='icon'
              variant='outline'
              className='rounded-full'
              aria-label='Stop generating response'
              onClick={() => props.stop()}
            >
              <StopCircle size={20} />
            </Button>
          ) : (
            <Button
              type='submit'
              size='icon'
              variant='outline'
              className='rounded-full'
              aria-label='Send message'
            >
              <ArrowUp size={20} />
            </Button>
          )}
        </div>
        <RemainingMessages remainingMessagesQuery={props.remainingMessagesQuery} />
      </div>
    </form>
  );
};
