import { db } from '@/core/database';
import { QueryBoundary } from '@/www/components/query-boundary';
import { H1 } from '@/www/components/ui/typography';
import { BibleReaderProvider } from '@/www/contexts/bible-reader';
import { cn } from '@/www/lib/utils';
import { A } from '@solidjs/router';
import { createQuery } from '@tanstack/solid-query';
import { ChevronLeft, ChevronRight } from 'lucide-solid';
import { Show } from 'solid-js';
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
              next: true,
            },
          },
        },
      },
    },
  });

  if (!bibleBookChapter) {
    throw new Error('Bible not found');
  }
  const { books, ...bible } = bibleBookChapter;

  if (!books.at(0)) {
    throw new Error('Book not found');
  }
  const { chapters, ...book } = books[0];

  if (!chapters.at(0)) {
    throw new Error('Chapter not found');
  }
  const chapter = chapters[0];

  if (!bible || !book || !chapter) {
    throw new Error('Insufficient chapter reader data');
  }

  return {
    bible,
    book,
    chapter,
  };
}

export const chapterReaderQueryOptions = (props: {
  bibleAbbr: string;
  bookAbbr: string;
  chapterNum: number;
}) => ({
  queryKey: ['chapter-reader', props],
  queryFn: () => getChapterReaderData(props),
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
      chapterNum: props.chapterNum,
    }),
  );

  return (
    <div class="flex max-w-3xl flex-col items-center px-8 py-5">
      <QueryBoundary query={query}>
        {({ bible, book, chapter }) => (
          <BibleReaderProvider bible={bible} book={book} chapter={chapter}>
            <BibleReaderMenu />
            <div class="mt-10">
              <div class="flex w-full justify-center">
                <H1 class="from-primary to-accent-foreground dark:from-accent-foreground dark:to-secondary-foreground inline-block bg-gradient-to-r bg-clip-text text-transparent">
                  {chapter.name}
                </H1>
              </div>
              <ReaderContent contents={chapter.content} />
              <Show when={chapter.previous}>
                <div class="fixed bottom-0 left-0 flex flex-col place-items-center justify-center">
                  <Tooltip placement="right">
                    <TooltipTrigger
                      as={A}
                      class={cn(buttonVariants(), 'my-auto h-10 w-5 rounded-tr-2xl')}
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
                <div class="fixed bottom-0 right-0 flex flex-col place-items-center justify-center">
                  <Tooltip placement="left">
                    <TooltipTrigger
                      as={A}
                      class={cn(buttonVariants(), 'my-auto h-10 w-5 rounded-tl-2xl')}
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
