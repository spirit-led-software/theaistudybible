import { allChatModels } from '@/ai/models';
import { cn } from '@/www/lib/utils';
import { getMessageId } from '@/www/utils/message';
import type { useChat } from '@ai-sdk/solid';
import type { Message as AIMessage } from '@ai-sdk/solid';
import { writeClipboard } from '@solid-primitives/clipboard';
import { A } from '@solidjs/router';
import { Copy } from 'lucide-solid';
import { Match, Show, Switch } from 'solid-js';
import { toast } from 'solid-sonner';
import { UserAvatar } from '../../auth/user-avatar';
import { Icon } from '../../branding/icon';
import { AnimatedMarkdown } from '../../ui/animated-markdown';
import { Button } from '../../ui/button';
import { Markdown } from '../../ui/markdown';
import { MessageReactionButtons } from './reaction-buttons';
import { Tools } from './tools';

export type MessageProps = {
  previousMessage?: AIMessage;
  nextMessage?: AIMessage;
  message: AIMessage;
  addToolResult: ReturnType<typeof useChat>['addToolResult'];
  isLoading: boolean;
};

export const Message = (props: MessageProps) => {
  return (
    <article
      class={cn(
        'flex w-full max-w-3xl space-x-4 overflow-hidden px-3 py-4',
        props.previousMessage?.role === props.message.role ? 'border-t-0' : 'border-t',
      )}
      aria-label={`${props.message.role === 'assistant' ? 'AI' : 'User'} message`}
    >
      <div class='mt-2 flex h-full w-10 shrink-0 items-start'>
        <Show when={props.previousMessage?.role !== props.message.role}>
          <Switch>
            <Match when={props.message.role === 'user'}>
              <UserAvatar class='size-10 shrink-0' aria-label='User avatar' />
            </Match>
            <Match when={props.message.role === 'assistant'}>
              <div
                class='flex size-10 shrink-0 place-items-center justify-center overflow-hidden rounded-full bg-primary p-2'
                aria-label='AI assistant avatar'
              >
                <Icon width={300} height={300} class='shrink-0' aria-hidden='true' />
              </div>
            </Match>
          </Switch>
        </Show>
      </div>
      <div class='flex w-full flex-col gap-4 overflow-hidden'>
        <Show when={props.message.content}>
          {(content) => (
            <Show
              when={props.isLoading && props.message.role === 'assistant' && !props.nextMessage}
              fallback={<Markdown>{content()}</Markdown>}
            >
              <AnimatedMarkdown>{content()}</AnimatedMarkdown>
            </Show>
          )}
        </Show>
        <Show
          when={Boolean(props.message.toolInvocations?.length) && props.message.toolInvocations}
        >
          {(toolInvocations) => (
            <Tools
              toolInvocations={toolInvocations()}
              addToolResult={props.addToolResult}
              isLoading={props.isLoading && !props.nextMessage}
            />
          )}
        </Show>
        <Show
          when={
            props.message.role === 'assistant' && props.message.role !== props.nextMessage?.role
          }
        >
          <div class='flex items-center gap-1' role='toolbar' aria-label='Message actions'>
            <Show
              when={
                props.message.annotations?.find(
                  (a) =>
                    typeof a === 'object' &&
                    a !== null &&
                    !Array.isArray(a) &&
                    'modelId' in a &&
                    typeof a.modelId === 'string',
                ) as { modelId: string } | undefined
              }
            >
              {(annotation) => (
                <Show
                  when={allChatModels.find((m) => `${m.host}:${m.id}` === annotation().modelId)}
                >
                  {(modelInfo) => (
                    <Button
                      variant='outline'
                      as={A}
                      href={modelInfo().link}
                      target='_blank'
                      rel='noopener noreferrer'
                      class='w-fit rounded-full border p-2 text-muted-foreground text-xs'
                    >
                      {modelInfo().name}
                    </Button>
                  )}
                </Show>
              )}
            </Show>
            <Button
              variant='ghost'
              class='h-fit w-fit p-1'
              onClick={() => {
                writeClipboard([
                  new ClipboardItem({
                    'text/plain': new Blob([props.message.content], {
                      type: 'text/plain',
                    }),
                  }),
                ]);
                toast.success('Text copied');
              }}
              aria-label='Copy message'
            >
              <Copy size={15} aria-hidden='true' />
            </Button>
            <MessageReactionButtons messageId={getMessageId(props.message)} />
          </div>
        </Show>
      </div>
    </article>
  );
};
