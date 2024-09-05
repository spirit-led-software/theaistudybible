import type { askForConfirmationTool } from '@/ai/chat/tools';
import { toCapitalizedCase } from '@/core/utils/string';
import { Button } from '@/www/components/ui/button';
import { H5 } from '@/www/components/ui/typography';
import type { useChat } from '@ai-sdk/solid';
import type { ToolInvocation } from 'ai';
import { MessageCircleWarning } from 'lucide-solid';
import { Show } from 'solid-js';
import type { z } from 'zod';

export type AskForConfirmationToolProps = {
  toolInvocation: ToolInvocation;
  addToolResult: ReturnType<typeof useChat>['addToolResult'];
};

export const AskForConfirmationTool = (props: AskForConfirmationToolProps) => {
  return (
    <div class="flex w-full flex-col">
      <H5 class="flex items-center">
        <MessageCircleWarning class="mr-2" size={18} />
        Confirm Action
      </H5>
      <Show
        when={
          'result' in props.toolInvocation &&
          (props.toolInvocation.result as {
            status: 'canceled' | 'confirmed';
          })
        }
        fallback={
          <div class="flex w-full flex-col space-y-2">
            <Show
              when={
                props.toolInvocation.args as z.infer<(typeof askForConfirmationTool)['parameters']>
              }
              keyed
            >
              {(toolArgs) => <p>{toolArgs.message}</p>}
            </Show>
            <div class="flex space-x-2">
              <Button
                variant="outline"
                onClick={() =>
                  props.addToolResult({
                    toolCallId: props.toolInvocation.toolCallId,
                    result: {
                      status: 'canceled',
                    },
                  })
                }
              >
                No
              </Button>
              <Button
                onClick={() =>
                  props.addToolResult({
                    toolCallId: props.toolInvocation.toolCallId,
                    result: {
                      status: 'confirmed',
                    },
                  })
                }
              >
                Yes
              </Button>
            </div>
          </div>
        }
        keyed
      >
        {(result) => (
          <div class="flex items-center">
            <span class="text-sm">{toCapitalizedCase(result.status)}</span>
          </div>
        )}
      </Show>
    </div>
  );
};
