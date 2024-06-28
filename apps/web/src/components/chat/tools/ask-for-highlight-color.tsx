import { useChat } from '@ai-sdk/solid';
import { toCapitalizedCase } from '@theaistudybible/core/util/string';
import { ToolInvocation } from 'ai';
import { Show, createSignal } from 'solid-js';
import { ColorItem } from '~/components/bible/reader/activity-panel/highlight/color-item';
import { HighlightColorPicker } from '~/components/bible/reader/activity-panel/highlight/color-picker';
import { Button } from '~/components/ui/button';
import { ToggleGroup } from '~/components/ui/toggle-group';
import { H6 } from '~/components/ui/typography';

export type AskForHighlightColorToolProps = {
  toolInvocation: ToolInvocation;
  addToolResult: ReturnType<typeof useChat>['addToolResult'];
};

export const AskForHighlightColorTool = (props: AskForHighlightColorToolProps) => {
  const [tgValue, setTgValue] = createSignal<string | undefined>();
  const [customColor, setCustomColor] = createSignal<string>();

  return (
    <div class="flex w-full flex-col">
      <H6>Select Highlight Color</H6>
      <Show
        when={
          'result' in props.toolInvocation &&
          (props.toolInvocation.result as {
            status: 'canceled' | 'confirmed';
            color: string;
          })
        }
        fallback={
          <div class="mt-3 flex w-full flex-col space-y-2 p-3">
            <ToggleGroup class="grid grid-cols-4 grid-rows-2" onChange={setTgValue}>
              <ColorItem title="Pink" hex="#FFC0CB" />
              <ColorItem title="Blue" hex="#ADD8E6" />
              <ColorItem title="Green" hex="#90EE90" />
              <ColorItem title="Yellow" hex="#FFFF00" />
              <ColorItem title="Orange" hex="#FFA500" />
              <ColorItem title="Purple" hex="#DDA0DD" />
              <ColorItem title="Red" hex="#FF6347" />
              <HighlightColorPicker setColor={setCustomColor} />
            </ToggleGroup>
            <div class="flex justify-end space-x-2">
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
                Cancel
              </Button>
              <Button
                onClick={() =>
                  props.addToolResult({
                    toolCallId: props.toolInvocation.toolCallId,
                    result: {
                      status: 'confirmed',
                      color: tgValue() || customColor()
                    }
                  })
                }
              >
                Save
              </Button>
            </div>
          </div>
        }
        keyed
      >
        {(result) => (
          <div class="flex items-center space-x-2">
            <span class="text-sm">{toCapitalizedCase(result.status)}</span>
            <Show when={result.color}>
              <div
                class="ml-2 inline-flex h-4 w-4 shrink-0 rounded-full"
                style={{
                  'background-color': result.color
                }}
              />
            </Show>
          </div>
        )}
      </Show>
    </div>
  );
};
