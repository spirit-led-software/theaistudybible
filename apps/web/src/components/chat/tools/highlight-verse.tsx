import { A } from '@solidjs/router';
import { highlightVerseTool } from '@theaistudybible/ai/chat/tools';
import { ToolInvocation } from 'ai';
import { Show } from 'solid-js';
import { z } from 'zod';
import { buttonVariants } from '~/components/ui/button';
import { H6 } from '~/components/ui/typography';
import { cn, formVerseString } from '~/lib/utils';

export type HighlightVerseToolProps = {
  toolInvocation: ToolInvocation;
};

export const HighlightVerseTool = (props: HighlightVerseToolProps) => {
  return (
    <div class="flex w-full flex-col">
      <H6>Highlight Verse</H6>
      <Show
        when={
          props.toolInvocation.args as z.infer<ReturnType<typeof highlightVerseTool>['parameters']>
        }
        keyed
      >
        {(toolArgs) => (
          <div class="flex items-center">
            <span class="text-sm">
              {toolArgs.bookName} {toolArgs.chapterNumber}:{formVerseString(toolArgs.verseNumbers)}{' '}
              ({toolArgs.bibleAbbr})
            </span>
            <div
              class="ml-2 inline-flex h-4 w-4 shrink-0 rounded-full"
              style={{
                'background-color': toolArgs.color || '#FFD700'
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
          <span class="text-sm">
            <Show
              when={result.status === 'error' && result}
              fallback={
                <span>
                  Success!
                  <Show when={result.status === 'success' && result} keyed>
                    {(successResult) => (
                      <A
                        href={`/bible/${successResult.bible.abbreviation}/${successResult.book.abbreviation}/${successResult.chapter.number}`}
                        class={cn(
                          buttonVariants({ variant: 'link' }),
                          'ml-2 h-fit p-0 text-accent-foreground'
                        )}
                      >
                        View
                      </A>
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
