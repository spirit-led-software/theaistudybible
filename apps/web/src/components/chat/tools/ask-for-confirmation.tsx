import { useChat } from '@ai-sdk/solid';
import { askForConfirmationTool } from '@theaistudybible/ai/chat/tools';
import { toCapitalizedCase } from '@theaistudybible/core/util/string';
import { ToolInvocation } from 'ai';
import { Show } from 'solid-js';
import { z } from 'zod';
import { Button } from '~/components/ui/button';
import { H6 } from '~/components/ui/typography';

export type AskForConfirmationToolProps = {
  toolInvocation: ToolInvocation;
  addToolResult: ReturnType<typeof useChat>['addToolResult'];
};

export const AskForConfirmationTool = (props: AskForConfirmationToolProps) => {
  return (
    <div class="flex w-full flex-col">
      <H6>Confirm Action</H6>
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
                      status: 'canceled'
                    }
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
                      status: 'confirmed'
                    }
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
