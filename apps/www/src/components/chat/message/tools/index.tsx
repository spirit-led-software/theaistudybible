import type { useChat } from '@ai-sdk/solid';
import type { ToolInvocation } from 'ai';
import { type ComponentProps, For, Match, Show, Switch, splitProps } from 'solid-js';
import { H6 } from '../../../ui/typography';
import { AskForHighlightColorTool } from './ask-for-highlight-color';
import { BookmarkTool } from './bookmark';
import { HighlightVerseTool } from './highlight-verse';
import { GenerateImageTool } from './image';
import { VectorStoreTool } from './vector-store';

export type ToolsProps = Omit<ComponentProps<'div'>, 'children'> & {
  toolInvocations: ToolInvocation[];
  addToolResult: ReturnType<typeof useChat>['addToolResult'];
  isLoading: boolean;
};

export const Tools = (props: ToolsProps) => {
  const [local, rest] = splitProps(props, ['toolInvocations', 'addToolResult', 'isLoading']);
  return (
    <div {...rest} class='flex w-full flex-col gap-2 [&:not(:first-child)]:mt-6'>
      <For each={local.toolInvocations}>
        {(toolInvocation, idx) => (
          <div data-idx={idx()} class='flex w-full flex-col'>
            <Switch
              fallback={
                <div class='flex w-full flex-col'>
                  <H6>{toolInvocation.toolName}</H6>
                  <Show when={'result' in toolInvocation && toolInvocation.result}>
                    {(result) => (
                      <p>
                        <strong>Result:</strong> {result()}
                      </p>
                    )}
                  </Show>
                </div>
              }
            >
              <Match when={toolInvocation.toolName === 'askForHighlightColor'}>
                <AskForHighlightColorTool toolInvocation={toolInvocation} />
              </Match>
              <Match when={toolInvocation.toolName === 'highlightVerse'}>
                <HighlightVerseTool toolInvocation={toolInvocation} />
              </Match>
              <Match
                when={
                  toolInvocation.toolName === 'bookmarkVerse' ||
                  toolInvocation.toolName === 'bookmarkChapter'
                }
              >
                <BookmarkTool toolInvocation={toolInvocation} />
              </Match>
              <Match when={toolInvocation.toolName === 'generateImage'}>
                <GenerateImageTool toolInvocation={toolInvocation} isLoading={local.isLoading} />
              </Match>
              <Match when={toolInvocation.toolName === 'vectorStore'}>
                <VectorStoreTool toolInvocation={toolInvocation} isLoading={local.isLoading} />
              </Match>
            </Switch>
          </div>
        )}
      </For>
    </div>
  );
};
