import type { useChat } from '@ai-sdk/solid';
import type { ToolInvocation } from 'ai';
import { For, Match, Show, Switch } from 'solid-js';
import { H6 } from '../../../ui/typography';
import { AskForConfirmationTool } from './ask-for-confirmation';
import { AskForHighlightColorTool } from './ask-for-highlight-color';
import { BookmarkTool } from './bookmark';
import { HighlightVerseTool } from './highlight-verse';
import { GenerateImageTool } from './image';
import { SaveContextTool } from './save-context';
import { VectorStoreTool } from './vector-store';

export type ToolsProps = {
  toolInvocations: ToolInvocation[];
  addToolResult: ReturnType<typeof useChat>['addToolResult'];
  isLoading: boolean;
};

export const Tools = (props: ToolsProps) => {
  return (
    <For each={props.toolInvocations}>
      {(toolInvocation, idx) => (
        <div data-idx={idx()} class='flex w-full flex-col [&:not(:first-child)]:mt-6'>
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
            <Match when={toolInvocation.toolName === 'askForConfirmation'}>
              <AskForConfirmationTool
                toolInvocation={toolInvocation}
                addToolResult={props.addToolResult}
              />
            </Match>
            <Match when={toolInvocation.toolName === 'askForHighlightColor'}>
              <AskForHighlightColorTool
                toolInvocation={toolInvocation}
                addToolResult={props.addToolResult}
              />
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
              <GenerateImageTool toolInvocation={toolInvocation} isLoading={props.isLoading} />
            </Match>
            <Match when={toolInvocation.toolName === 'vectorStore'}>
              <VectorStoreTool toolInvocation={toolInvocation} isLoading={props.isLoading} />
            </Match>
            <Match when={toolInvocation.toolName === 'saveContext'}>
              <SaveContextTool toolInvocation={toolInvocation} isLoading={props.isLoading} />
            </Match>
          </Switch>
        </div>
      )}
    </For>
  );
};
