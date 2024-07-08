import { useChat } from '@ai-sdk/solid';
import { writeClipboard } from '@solid-primitives/clipboard';
import { A } from '@solidjs/router';
import { allModels } from '@theaistudybible/ai/models';
import type { Message as AIMessage } from 'ai/solid';
import { Check, Copy } from 'lucide-solid';
import { Match, Show, Switch } from 'solid-js';
import { Markdown } from '~/components/ui/markdown';
import { useUser } from '~/hooks/clerk';
import { cn } from '~/lib/utils';
import Icon from '../../branding/icon';
import { Button } from '../../ui/button';
import { showToast } from '../../ui/toast';
import { Tooltip, TooltipContent, TooltipTrigger } from '../../ui/tooltip';
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
  const { user } = useUser();

  return (
    <div
      class={cn(
        'flex w-full space-x-4 py-4 pl-5',
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
            <Tools
              toolInvocations={toolInvocations}
              addToolResult={props.addToolResult}
              isLoading={props.isLoading && !props.nextMessage}
            />
          )}
        </Show>
        <div class="flex items-center gap-2 py-2">
          <Show when={props.message.data} keyed>
            {(data) => (
              <div>
                <Show
                  when={
                    props.message.role !== props.nextMessage?.role &&
                    'modelId' in (data as any) &&
                    (data as any).modelId
                  }
                  keyed
                >
                  {(modelId) => {
                    const modelInfo = allModels.find((m) => m.id === modelId.split(':')[1]);
                    if (!modelInfo) {
                      return null;
                    }

                    return (
                      <Tooltip>
                        <TooltipTrigger
                          as={A}
                          href={modelInfo.link}
                          class="mt-2 w-fit rounded-full border p-2 text-xs text-gray-500"
                        >
                          {modelInfo.name}
                        </TooltipTrigger>
                        <TooltipContent>{modelInfo.description}</TooltipContent>
                      </Tooltip>
                    );
                  }}
                </Show>
              </div>
            )}
          </Show>
          <div class="flex gap-1">
            <Show
              when={
                props.message.role === 'assistant' && props.message.role !== props.nextMessage?.role
              }
            >
              <Button
                variant="ghost"
                class="h-fit w-fit p-1"
                onClick={() => {
                  writeClipboard([
                    new ClipboardItem({
                      'text/plain': new Blob([props.message.content], { type: 'text/plain' })
                    })
                  ]);
                  showToast({
                    title: (
                      <div class="flex items-center gap-2">
                        <Check />
                        Text copied
                      </div>
                    )
                  });
                }}
              >
                <Copy size={15} />
              </Button>
              <MessageReactionButtons messageId={props.message.id} />
            </Show>
          </div>
        </div>
      </div>
    </div>
  );
};
