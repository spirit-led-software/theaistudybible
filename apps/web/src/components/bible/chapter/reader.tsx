import { A } from '@solidjs/router';
import { createQuery } from '@tanstack/solid-query';
import { db } from '@theaistudybible/core/database';
import { ChevronLeft, ChevronRight } from 'lucide-solid';
import { Show } from 'solid-js';
import { BibleReaderProvider } from '~/components/providers/bible-reader';
import { QueryBoundary } from '~/components/query-boundary';
import { H1 } from '~/components/ui/typography';
import { cn } from '~/lib/utils';
import { buttonVariants } from '../../ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '../../ui/tooltip';
import { ReaderContent } from '../reader';
import { BibleReaderMenu } from '../reader/menu';

async function getChapterReaderData(props: {
  bibleAbbr: string;
  bookAbbr: string;
  chapterNum: number;
}) {
  'use server';
  const bibleBookChapter = await db.query.bibles.findFirst({
    where: (bibles, { eq }) => eq(bibles.abbreviation, props.bibleAbbr),
    with: {
      books: {
        limit: 1,
        where: (books, { eq }) => eq(books.abbreviation, props.bookAbbr),
        with: {
          chapters: {
            limit: 1,
            where: (chapters, { eq }) => eq(chapters.number, props.chapterNum),
            with: {
              previous: true,
              next: true
            }
          }
        }
      }
    }
  });

  const book = bibleBookChapter?.books[0];
  const chapter = book?.chapters[0];

  if (!bibleBookChapter || !book || !chapter) {
    throw new Error('Insufficient data');
  }

  return {
    bible: bibleBookChapter,
    book,
    chapter
  };
}

export const chapterReaderQueryOptions = (props: {
  bibleAbbr: string;
  bookAbbr: string;
  chapterNum: number;
}) => ({
  queryKey: ['chapter-reader', props],
  queryFn: () => getChapterReaderData(props)
});

export type ChapterReaderProps = {
  bibleAbbr: string;
  bookAbbr: string;
  chapterNum: number;
};
export default function ChapterReader(props: ChapterReaderProps) {
  const query = createQuery(() =>
    chapterReaderQueryOptions({
      bibleAbbr: props.bibleAbbr,
      bookAbbr: props.bookAbbr,
      chapterNum: props.chapterNum
    })
  );

  return (
    <div class="flex max-w-2xl flex-col items-center px-10 py-5">
      <QueryBoundary query={query}>
        {({ bible, book, chapter }) => (
          <BibleReaderProvider bible={bible} book={book} chapter={chapter}>
            <BibleReaderMenu />
            <div class="mt-10">
              <div class="flex w-full justify-center">
                <H1 class="inline-block bg-gradient-to-r from-primary to-accent-foreground bg-clip-text text-transparent dark:from-accent-foreground dark:to-secondary-foreground">
                  {chapter.name}
                </H1>
              </div>
              <ReaderContent contents={chapter.content} />
              <Show when={chapter.previous}>
                <div class="fixed bottom-1/3 left-0 top-1/3 flex flex-col place-items-center justify-center">
                  <Tooltip placement="right">
                    <TooltipTrigger
                      as={A}
                      class={cn(buttonVariants(), 'my-auto h-20 w-10 rounded-r-2xl')}
                      href={`/bible/${bible.abbreviation}/${chapter.previous!.abbreviation.split('.')[0]}/${chapter.previous!.number}`}
                    >
                      <ChevronLeft size={20} class="shrink-0" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{chapter.previous!.name}</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
              </Show>
              <Show when={chapter.next}>
                <div class="fixed bottom-1/3 right-0 top-1/3 flex flex-col place-items-center justify-center">
                  <Tooltip placement="left">
                    <TooltipTrigger
                      as={A}
                      class={cn(buttonVariants(), 'my-auto h-20 w-10 rounded-l-2xl')}
                      href={`/bible/${bible.abbreviation}/${chapter.next!.abbreviation.split('.')[0]}/${chapter.next!.number}`}
                    >
                      <ChevronRight size={20} class="shrink-0" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{chapter.next!.name}</p>
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
