import type { highlightVerseTool } from '@/ai/chat/tools';
import { formNumberSequenceString } from '@/core/utils/number';
import { buttonVariants } from '@/www/components/ui/button';
import { H5, H6 } from '@/www/components/ui/typography';
import { cn } from '@/www/lib/utils';
import { A } from '@solidjs/router';
import type { ToolInvocation } from 'ai';
import { Highlighter } from 'lucide-solid';
import { Show } from 'solid-js';
import type { z } from 'zod';

export type HighlightVerseToolProps = {
  toolInvocation: ToolInvocation;
};

export const HighlightVerseTool = (props: HighlightVerseToolProps) => {
  return (
    <div class="flex w-full flex-col">
      <H5 class="flex items-center">
        <Highlighter class="mr-2" size={18} />
        Highlight Verse
      </H5>
      <Show
        when={
          props.toolInvocation.args as z.infer<ReturnType<typeof highlightVerseTool>['parameters']>
        }
        keyed
      >
        {(toolArgs) => (
          <div class="flex items-center space-x-2 text-sm">
            <span>
              {toolArgs.bookName} {toolArgs.chapterNumber}:
              {formNumberSequenceString(toolArgs.verseNumbers)} ({toolArgs.bibleAbbr})
            </span>
            <div
              class="h-4 w-4 shrink-0 rounded-full"
              style={{
                'background-color': toolArgs.color || '#FFD700',
              }}
            />
          </div>
        )}
      </Show>
      <Show
        when={
          'result' in props.toolInvocation &&
          (props.toolInvocation.result as Awaited<
            ReturnType<ReturnType<typeof highlightVerseTool>['execute']>
          >)
        }
        keyed
      >
        {(result) => (
          <div class="mt-2 flex w-full flex-col">
            <H6>Result</H6>
            <Show
              when={result.status === 'error' && result}
              fallback={
                <div class="flex flex-col text-sm">
                  <Show when={result.status === 'success' && result} keyed>
                    {(successResult) => (
                      <div class="flex items-center space-x-2">
                        <span>
                          {successResult.book.shortName} {successResult.chapter.number}:
                          {formNumberSequenceString(successResult.verses.map((v) => v.number))}
                        </span>
                        <A
                          href={`/bible/${successResult.bible.abbreviation}/${successResult.book.abbreviation}/${successResult.chapter.number}`}
                          class={cn(
                            buttonVariants({ variant: 'link' }),
                            'text-accent-foreground h-fit p-0',
                          )}
                        >
                          View
                        </A>
                      </div>
                    )}
                  </Show>
                </div>
              }
              keyed
            >
              {(failedResult) => (
                <div class="flex flex-col text-sm">
                  <span>Failed</span>
                  <span>{failedResult.message}</span>
                </div>
              )}
            </Show>
          </div>
        )}
      </Show>
    </div>
  );
};
