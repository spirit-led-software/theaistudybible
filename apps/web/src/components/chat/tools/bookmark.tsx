import { A } from '@solidjs/router';
import { bookmarkChapterTool, bookmarkVerseTool } from '@theaistudybible/ai/chat/tools';
import { ToolInvocation } from 'ai';
import { Show } from 'solid-js';
import { z } from 'zod';
import { Button } from '~/components/ui/button';
import { H6 } from '~/components/ui/typography';

export type BookmarkToolProps = {
  toolInvocation: ToolInvocation;
};

export const BookmarkTool = (props: BookmarkToolProps) => {
  return (
    <div class="flex w-full flex-col">
      <H6 class="font-bold">Bookmark</H6>
      <Show
        when={
          props.toolInvocation.args as z.infer<
            | ReturnType<typeof bookmarkChapterTool>['parameters']
            | ReturnType<typeof bookmarkVerseTool>['parameters']
          >
        }
        keyed
      >
        {(toolArgs) => (
          <p>
            {toolArgs.bookName} {toolArgs.chapterNumber}
            {'verseNumber' in toolArgs && `:${toolArgs.verseNumber}`} ({toolArgs.bibleAbbr})
          </p>
        )}
      </Show>
      <Show
        when={
          'result' in props.toolInvocation &&
          (props.toolInvocation.result as Awaited<
            ReturnType<
              | ReturnType<typeof bookmarkChapterTool>['execute']
              | ReturnType<typeof bookmarkVerseTool>['execute']
            >
          >)
        }
        keyed
      >
        {(result) => (
          <span>
            <strong>Result: </strong>
            <Show
              when={result.status === 'error' && result}
              fallback={
                <span>
                  Success!
                  <Show when={result.status === 'success' && result} keyed>
                    {(successResult) => (
                      <Button
                        as={A}
                        href={`/bible/${successResult.bible.abbreviation}/${successResult.book.abbreviation}/${successResult.chapter.number}${'verse' in successResult && `/${successResult.verse.number}`}`}
                        variant="link"
                        class="ml-2 h-fit p-0 text-accent-foreground"
                      >
                        View
                      </Button>
                    )}
                  </Show>
                </span>
              }
              keyed
            >
              {(failedResult) => <span>Failed - {failedResult.message}</span>}
            </Show>
          </span>
        )}
      </Show>
    </div>
  );
};
