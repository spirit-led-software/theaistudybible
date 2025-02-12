import type { useChat } from '@ai-sdk/solid';
import type { ToolInvocation } from 'ai';
import { Match, Show, Switch } from 'solid-js';
import { H6 } from '../../../ui/typography';
import { AskForHighlightColorTool } from './ask-for-highlight-color';
import { BookmarkTool } from './bookmark';
import { HighlightVerseTool } from './highlight-verse';
import { GenerateImageTool } from './image';
import { VectorStoreTool } from './vector-store';

export type ToolProps = {
  toolInvocation: ToolInvocation;
  addToolResult: ReturnType<typeof useChat>['addToolResult'];
  isLoading: boolean;
};

export const Tool = (props: ToolProps) => {
  return (
    <div class='flex w-full flex-col'>
      <Switch
        fallback={
          <div class='flex w-full flex-col'>
            <H6>{props.toolInvocation.toolName}</H6>
            <Show when={'result' in props.toolInvocation && props.toolInvocation.result}>
              {(result) => (
                <p>
                  <strong>Result:</strong> {result()}
                </p>
              )}
            </Show>
          </div>
        }
      >
        <Match when={props.toolInvocation.toolName === 'askForHighlightColor'}>
          <AskForHighlightColorTool
            toolInvocation={props.toolInvocation}
            addToolResult={props.addToolResult}
          />
        </Match>
        <Match when={props.toolInvocation.toolName === 'highlightVerse'}>
          <HighlightVerseTool toolInvocation={props.toolInvocation} />
        </Match>
        <Match
          when={
            props.toolInvocation.toolName === 'bookmarkVerse' ||
            props.toolInvocation.toolName === 'bookmarkChapter'
          }
        >
          <BookmarkTool toolInvocation={props.toolInvocation} />
        </Match>
        <Match when={props.toolInvocation.toolName === 'generateImage'}>
          <GenerateImageTool toolInvocation={props.toolInvocation} isLoading={props.isLoading} />
        </Match>
        <Match when={props.toolInvocation.toolName === 'vectorStore'}>
          <VectorStoreTool toolInvocation={props.toolInvocation} isLoading={props.isLoading} />
        </Match>
      </Switch>
    </div>
  );
};
