import type { bookmarkChapterTool, bookmarkVerseTool } from '@/ai/chat/tools';
import { formNumberSequenceString } from '@/core/utils/number';
import { Button } from '@/www/components/ui/button';
import { H5, H6 } from '@/www/components/ui/typography';
import { A } from '@solidjs/router';
import type { ToolInvocation } from 'ai';
import { Bookmark } from 'lucide-solid';
import { For, Match, Show, Switch } from 'solid-js';
import type { z } from 'zod';

export type BookmarkToolProps = {
  toolInvocation: ToolInvocation;
};

export const BookmarkTool = (props: BookmarkToolProps) => {
  return (
    <div class='flex w-full flex-col'>
      <H5 class='flex items-center'>
        <Bookmark class='mr-2' size={18} />
        Bookmark
      </H5>
      <Show
        when={
          props.toolInvocation.args as z.infer<
            | ReturnType<typeof bookmarkChapterTool>['parameters']
            | ReturnType<typeof bookmarkVerseTool>['parameters']
          >
        }
      >
        {(toolArgs) => (
          <Switch>
            <Match
              when={
                'chapterNumbers' in toolArgs() &&
                (toolArgs() as { bibleAbbr: string; bookName: string; chapterNumbers: number[] })
              }
            >
              {(toolArgs) => (
                <For each={toolArgs().chapterNumbers}>
                  {(chapterNumber) => (
                    <span class='text-sm'>
                      {toolArgs().bookName} {chapterNumber}
                    </span>
                  )}
                </For>
              )}
            </Match>
            <Match
              when={
                'verseNumbers' in toolArgs() &&
                (toolArgs() as {
                  bibleAbbr: string;
                  bookName: string;
                  chapterNumber: number;
                  verseNumbers: number[];
                })
              }
            >
              {(toolArgs) => (
                <span class='text-sm'>
                  {toolArgs().bookName} {toolArgs().chapterNumber}:
                  {formNumberSequenceString(toolArgs().verseNumbers)}
                </span>
              )}
            </Match>
          </Switch>
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
          <div class='mt-1 flex flex-col'>
            <H6>Result</H6>
            <Show
              when={result.status === 'error' && result}
              fallback={
                <div class='flex flex-col text-sm'>
                  <Show when={result.status === 'success' && result} keyed>
                    {(successResult) => (
                      <Switch>
                        <Match when={'verses' in successResult && successResult} keyed>
                          {(successResult) => (
                            <div class='flex items-center space-x-2'>
                              <span>
                                {successResult.book.shortName} {successResult.chapter.number}:
                                {formNumberSequenceString(
                                  successResult.verses.map((verse) => verse.number),
                                )}
                              </span>
                              <Button
                                as={A}
                                href={`/bible/${successResult.bible.abbreviation}/${successResult.book.code}/${successResult.chapter.number}`}
                                variant='link'
                                class='h-fit p-0 text-accent-foreground'
                              >
                                View
                              </Button>
                            </div>
                          )}
                        </Match>
                        <Match when={'chapters' in successResult && successResult} keyed>
                          {(successResult) => (
                            <For each={successResult.chapters}>
                              {(chapter) => (
                                <div class='flex items-center space-x-2'>
                                  <span>
                                    {successResult.book.shortName} {chapter.number}
                                  </span>
                                  <Button
                                    as={A}
                                    href={`/bible/${successResult.bible.abbreviation}/${successResult.book.code}/${chapter.number}`}
                                    variant='link'
                                    class='h-fit p-0 text-accent-foreground'
                                  >
                                    View
                                  </Button>
                                </div>
                              )}
                            </For>
                          )}
                        </Match>
                      </Switch>
                    )}
                  </Show>
                </div>
              }
              keyed
            >
              {(failedResult) => (
                <div class='flex flex-col'>
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
