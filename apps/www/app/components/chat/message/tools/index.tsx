import { H6 } from '@/www/components/ui/typography';
import type { useChat } from '@/www/hooks/use-chat';
import type { ToolInvocation } from 'ai';
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
  switch (props.toolInvocation.toolName) {
    case 'askForHighlightColor':
      return (
        <AskForHighlightColorTool
          toolInvocation={props.toolInvocation}
          addToolResult={props.addToolResult}
        />
      );
    case 'highlightVerse':
      return <HighlightVerseTool toolInvocation={props.toolInvocation} />;
    case 'bookmarkVerse':
    case 'bookmarkChapter':
      return <BookmarkTool toolInvocation={props.toolInvocation} />;
    case 'generateImage':
      return (
        <GenerateImageTool toolInvocation={props.toolInvocation} isLoading={props.isLoading} />
      );
    case 'vectorStore':
      return <VectorStoreTool toolInvocation={props.toolInvocation} isLoading={props.isLoading} />;
    default:
      return (
        <div className='flex w-full flex-col'>
          <H6>{props.toolInvocation.toolName}</H6>
          {'result' in props.toolInvocation && props.toolInvocation.result && (
            <p>
              <strong>Result:</strong> {props.toolInvocation.result.toString()}
            </p>
          )}
        </div>
      );
  }
};
