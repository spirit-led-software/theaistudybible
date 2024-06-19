import { A } from '@solidjs/router';
import { createQuery } from '@tanstack/solid-query';
import { ChevronLeft, ChevronRight } from 'lucide-solid';
import { Accessor, Show } from 'solid-js';
import { BibleReaderProvider } from '~/components/providers/bible-reader';
import { QueryBoundary } from '~/components/query-boundary';
import { H1 } from '~/components/ui/typography';
import { cn } from '~/lib/utils';
import { Button, buttonVariants } from '../../ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '../../ui/tooltip';
import { ReaderContent } from '../reader';
import { BibleReaderMenu } from '../reader/menu';
import { getVerseReaderData } from './server';

export type VerseReaderProps = {
  bibleAbbr: Accessor<string>;
  bookAbbr: Accessor<string>;
  chapterNum: Accessor<number>;
  verseNum: Accessor<number>;
};

export const getVerseReaderQueryOptions = (props: {
  bibleAbbr: string;
  bookAbbr: string;
  chapterNum: number;
  verseNum: number;
}) => ({
  queryKey: ['verse-reader', props],
  queryFn: () => getVerseReaderData(props)
});

export default function VerseReader(props: {
  bibleAbbr: string;
  bookAbbr: string;
  chapterNum: number;
  verseNum: number;
}) {
  const query = createQuery(() => getVerseReaderQueryOptions(props));

  return (
    <div class="flex max-w-2xl flex-col items-center px-10 py-5">
      <QueryBoundary query={query}>
        {(data) => (
          <BibleReaderProvider
            bible={data.bible}
            book={data.book}
            chapter={data.chapter}
            verse={data.verse}
          >
            <BibleReaderMenu />
            <div class="mt-10">
              <div class="flex w-full justify-center">
                <H1 class="inline-block bg-gradient-to-r from-primary to-accent-foreground bg-clip-text text-transparent dark:from-accent-foreground dark:to-secondary-foreground">
                  {data.verse.name}
                </H1>
              </div>
              <ReaderContent contents={data.verse.content} />
              <div class="flex w-full flex-col items-center">
                <Button
                  as={A}
                  href={`/bible/${data.bible.abbreviation}/${data.book.abbreviation}/${data.chapter.number}`}
                  variant="outline"
                >
                  More from {data.book.shortName} {data.chapter.number}
                </Button>
              </div>
              <Show when={data.verse.previous}>
                <div class="fixed bottom-1/3 left-0 top-1/3 flex flex-col place-items-center justify-center">
                  <Tooltip placement="right">
                    <TooltipTrigger
                      as={A}
                      class={cn(buttonVariants(), 'my-auto h-20 w-10 rounded-r-2xl')}
                      href={
                        `/bible/${data.bible.abbreviation}/${data.verse.previous!.abbreviation.split('.')[0]}` +
                        `/${data.verse.previous!.abbreviation.split('.')[1]}/${data.verse.previous!.number}`
                      }
                    >
                      <ChevronLeft size={20} class="shrink-0" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{data.verse.previous!.name}</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
              </Show>
              <Show when={data.verse.next}>
                <div class="fixed bottom-1/3 right-0 top-1/3 flex flex-col place-items-center justify-center">
                  <Tooltip placement="left">
                    <TooltipTrigger
                      as={A}
                      class={cn(buttonVariants(), 'my-auto h-20 w-10 rounded-l-2xl')}
                      href={
                        `/bible/${data.bible.abbreviation}/${data.verse.next!.abbreviation.split('.')[0]}` +
                        `/${data.verse.next!.abbreviation.split('.')[1]}/${data.verse.next!.number}`
                      }
                    >
                      <ChevronRight size={20} class="shrink-0" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{data.verse.next!.name}</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
              </Show>
            </div>
          </BibleReaderProvider>
        )}
      </QueryBoundary>
    </div>
  );
}