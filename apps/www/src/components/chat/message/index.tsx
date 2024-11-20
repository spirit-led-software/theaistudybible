import { allModels } from '@/ai/models';
import { Markdown } from '@/www/components/ui/markdown';
import { cn } from '@/www/lib/utils';
import type { useChat } from '@ai-sdk/solid';
import type { Message as AIMessage } from '@ai-sdk/solid';
import { writeClipboard } from '@solid-primitives/clipboard';
import { A } from '@solidjs/router';
import { Copy } from 'lucide-solid';
import { type Accessor, Match, Show, Switch } from 'solid-js';
import { toast } from 'solid-sonner';
import { UserAvatar } from '../../auth/user-avatar';
import { Icon } from '../../branding/icon';
import { Button } from '../../ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '../../ui/tooltip';
import { MessageReactionButtons } from './reaction-buttons';
import { Tools } from './tools';

export type MessageProps = {
  previousMessage?: AIMessage;
  nextMessage?: AIMessage;
  message: AIMessage;
  addToolResult: ReturnType<typeof useChat>['addToolResult'];
  isLoading: Accessor<boolean>;
};

export const Message = (props: MessageProps) => {
  return (
    <article
      class={cn(
        'flex w-full max-w-2xl space-x-4 px-3 py-4',
        props.previousMessage?.role === props.message.role ? 'border-t-0' : 'border-t',
      )}
      aria-label={`${props.message.role === 'assistant' ? 'AI' : 'User'} message`}
    >
      <div class='mt-2 flex h-full w-10 shrink-0 items-start'>
        <Show when={props.previousMessage?.role !== props.message.role}>
          <Switch>
            <Match when={props.message.role === 'user'}>
              <Tooltip>
                <TooltipTrigger as='div'>
                  <UserAvatar aria-label='User avatar' />
                </TooltipTrigger>
                <TooltipContent>Me</TooltipContent>
              </Tooltip>
            </Match>
            <Match when={props.message.role === 'assistant'}>
              <Tooltip>
                <TooltipTrigger as='div'>
                  <div
                    class='flex h-10 w-10 flex-shrink-0 place-items-center justify-center overflow-hidden rounded-full bg-primary p-2'
                    aria-label='AI assistant avatar'
                  >
                    <Icon width={300} height={300} class='flex-shrink-0' aria-hidden='true' />
                  </div>
                </TooltipTrigger>
                <TooltipContent>The AI Study Bible</TooltipContent>
              </Tooltip>
            </Match>
          </Switch>
        </Show>
      </div>
      <div class='flex w-full flex-col'>
        <Show when={props.message.content} keyed>
          {(content) => <Markdown>{content}</Markdown>}
        </Show>
        <Show
          when={(props.message.toolInvocations?.length ?? 0) > 0 && props.message.toolInvocations}
          keyed
        >
          {(toolInvocations) => (
            <Tools
              toolInvocations={toolInvocations}
              addToolResult={props.addToolResult}
              isLoading={props.isLoading() && !props.nextMessage}
            />
          )}
        </Show>
        <div class='flex items-center gap-1 py-2' role='toolbar' aria-label='Message actions'>
          <Show
            when={
              props.message.role === 'assistant' && props.message.role !== props.nextMessage?.role
            }
          >
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
              keyed
            >
              {({ modelId }) => (
                <Show when={allModels.find((m) => `${m.host}:${m.id}` === modelId)} keyed>
                  {(modelInfo) => (
                    <Button
                      variant='outline'
                      as={A}
                      href={modelInfo.link}
                      target='_blank'
                      rel='noopener noreferrer'
                      class='w-fit rounded-full border p-2 text-muted-foreground text-xs'
                    >
                      {modelInfo.name}
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
            <MessageReactionButtons messageId={props.message.id} />
          </Show>
        </div>
      </div>
    </article>
  );
};
