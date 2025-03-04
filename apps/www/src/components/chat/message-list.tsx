import type { useChat } from '@/www/hooks/use-chat';
import type { Message as AiMessage } from 'ai';
import { ChevronUp } from 'lucide-solid';
import { For, type Setter, Show } from 'solid-js';
import { Button } from '../ui/button';
import { Spinner } from '../ui/spinner';
import { EmptyWindow } from './empty-window';
import { Message } from './message';

export type ChatMessageListProps = {
  messages: AiMessage[];
  messagesQuery: ReturnType<typeof useChat>['messagesQuery'];
  isLoading: boolean;
  append: ReturnType<typeof useChat>['append'];
  addToolResult: ReturnType<typeof useChat>['addToolResult'];
  additionalContext?: string;
  setTopOfLastMessageRef: Setter<HTMLElement | undefined>;
  lastMessageIdx: number;
};

export const ChatMessageList = (props: ChatMessageListProps) => {
  return (
    <div class='flex w-full flex-1 flex-col items-center justify-end'>
      <div class='flex w-full items-start justify-center'>
        <Show when={props.messagesQuery.status === 'success' && props.messagesQuery.hasNextPage}>
          <div class='flex flex-col items-center justify-center'>
            <Button
              variant='link'
              size='icon'
              class='flex h-fit flex-col items-center justify-center py-4 text-foreground'
              disabled={props.messagesQuery.isFetchingNextPage}
              onClick={() => props.messagesQuery.fetchNextPage()}
              aria-label='Load previous messages'
            >
              {props.messagesQuery.isFetchingNextPage ? <Spinner size='sm' /> : <ChevronUp />}
            </Button>
          </div>
        </Show>
      </div>
      <div class='flex w-full flex-1 flex-col items-center justify-end'>
        <For
          each={props.messages}
          fallback={
            <EmptyWindow append={props.append} additionalContext={props.additionalContext} />
          }
        >
          {(message, idx) => (
            <>
              <Show when={idx() === props.lastMessageIdx}>
                <div ref={props.setTopOfLastMessageRef} class='h-px w-full shrink-0' />
              </Show>
              <Message
                previousMessage={props.messages[idx() - 1]}
                message={message}
                nextMessage={props.messages[idx() + 1]}
                addToolResult={props.addToolResult}
                isLoading={props.isLoading}
              />
            </>
          )}
        </For>
      </div>
    </div>
  );
};
