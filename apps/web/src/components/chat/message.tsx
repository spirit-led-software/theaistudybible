import { useChat } from '@ai-sdk/solid';
import type { Message as AIMessage } from 'ai/solid';
import { Match, Show, Switch } from 'solid-js';
import { Markdown } from '~/components/ui/markdown';
import { useUser } from '~/hooks/clerk';
import { cn } from '~/lib/utils';
import Icon from '../branding/icon';
import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/tooltip';
import { Tools } from './tools';

export type MessageProps = {
  previousMessage?: AIMessage;
  message: AIMessage;
  addToolResult: ReturnType<typeof useChat>['addToolResult'];
};

export const Message = (props: MessageProps) => {
  const { user } = useUser();

  return (
    <div
      class={cn(
        'flex w-full space-x-4 py-2 pl-5',
        props.previousMessage?.role === props.message.role ? 'border-t-0' : 'border-t'
      )}
    >
      <div class="mt-2 flex h-full w-10 shrink-0 items-start">
        <Show when={props.previousMessage?.role !== props.message.role}>
          <Switch>
            <Match when={props.message.role === 'user'}>
              <Tooltip>
                <TooltipTrigger as="div">
                  <img src={user()?.imageUrl} alt="Avatar" class="h-10 w-10 rounded-full" />
                </TooltipTrigger>
                <TooltipContent>Me</TooltipContent>
              </Tooltip>
            </Match>
            <Match when={props.message.role === 'assistant'}>
              <Tooltip>
                <TooltipTrigger as="div">
                  <div class="flex h-10 w-10 flex-shrink-0 place-items-center justify-center overflow-hidden rounded-full bg-primary p-2">
                    <Icon width={300} height={300} class="flex-shrink-0" />
                  </div>
                </TooltipTrigger>
                <TooltipContent>The AI Study Bible</TooltipContent>
              </Tooltip>
            </Match>
          </Switch>
        </Show>
      </div>
      <div class="flex w-full flex-col">
        <Show when={props.message.content} keyed>
          {(content) => <Markdown>{content}</Markdown>}
        </Show>
        <Show
          when={(props.message.toolInvocations?.length ?? 0) > 0 && props.message.toolInvocations}
          keyed
        >
          {(toolInvocations) => (
            <Tools toolInvocations={toolInvocations} addToolResult={props.addToolResult} />
          )}
        </Show>
      </div>
    </div>
  );
};
