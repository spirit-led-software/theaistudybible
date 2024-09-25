import { db } from '@/core/database';
import { QueryBoundary } from '@/www/components/query-boundary';
import { H1, Muted } from '@/www/components/ui/typography';
import { BibleReaderProvider } from '@/www/contexts/bible-reader';
import { cn } from '@/www/lib/utils';
import { A } from '@solidjs/router';
import { createQuery } from '@tanstack/solid-query';
import { ChevronLeft, ChevronRight, Copyright } from 'lucide-solid';
import { Show } from 'solid-js';
import { Button, buttonVariants } from '../../ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '../../ui/tooltip';
import { ReaderContent } from '../reader';
import { BibleReaderMenu } from '../reader/menu';

async function getChapterReaderData(props: {
  bibleAbbr: string;
  bookAbbr: string;
  chapterNum: number;
}) {
  'use server';
  const bibleData = await db.query.bibles.findFirst({
    where: (bibles, { eq }) => eq(bibles.abbreviation, props.bibleAbbr),
    with: {
      biblesToRightsHolders: { with: { rightsHolder: true } },
      books: {
        limit: 1,
        where: (books, { eq }) => eq(books.abbreviation, props.bookAbbr),
        with: {
          chapters: {
            limit: 1,
            where: (chapters, { eq }) => eq(chapters.number, props.chapterNum),
            with: { previous: true, next: true },
          },
        },
      },
    },
  });
  if (!bibleData) {
    throw new Error('Bible not found');
  }

  const { books, biblesToRightsHolders, ...bible } = bibleData;
  if (!books[0]) {
    throw new Error('Book not found');
  }

  const { chapters, ...book } = books[0];
  if (!chapters[0]) {
    throw new Error('Chapter not found');
  }

  const chapter = chapters[0];

  return {
    bible,
    book,
    chapter,
    rightsHolder: biblesToRightsHolders[0].rightsHolder,
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
    <div class='flex max-w-3xl flex-col items-center px-8 py-5'>
      <QueryBoundary query={query}>
        {({ bible, book, chapter, rightsHolder }) => (
          <BibleReaderProvider bible={bible} book={book} chapter={chapter}>
            <BibleReaderMenu />
            <div class='mt-10'>
              <div class='flex w-full justify-center'>
                <H1 class='inline-block bg-gradient-to-r from-primary to-accent-foreground bg-clip-text text-transparent dark:from-accent-foreground dark:to-secondary-foreground'>
                  {chapter.name}
                </H1>
              </div>
              <div class='mt-10 mb-5'>
                <ReaderContent contents={chapter.content} />
              </div>
              <div class='mb-20 flex flex-col items-center gap-2'>
                <Muted>
                  Copyright
                  <Copyright class='mx-2 inline-block size-4' />
                  <Button
                    as={A}
                    variant='link'
                    href={rightsHolder.url}
                    class='p-0 text-muted-foreground'
                  >
                    {rightsHolder.nameLocal}
                  </Button>
                </Muted>
                <Muted>{bible.copyrightStatement}</Muted>
              </div>
              <Show when={chapter.previous}>
                <Tooltip placement='right'>
                  <TooltipTrigger
                    as={A}
                    class={cn(
                      buttonVariants(),
                      'fixed bottom-0 left-0 my-auto flex h-20 w-8 flex-col place-items-center justify-center rounded-none rounded-tr-2xl pb-safe pl-safe',
                    )}
                    href={`/bible/${bible.abbreviation}/${chapter.previous!.abbreviation.split('.')[0]}/${chapter.previous!.number}`}
                  >
                    <ChevronLeft size={20} class='shrink-0' />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{chapter.previous!.name}</p>
                  </TooltipContent>
                </Tooltip>
              </Show>
              <Show when={chapter.next}>
                <Tooltip placement='left'>
                  <TooltipTrigger
                    as={A}
                    class={cn(
                      buttonVariants(),
                      'fixed right-0 bottom-0 my-auto flex h-20 w-8 flex-col place-items-center justify-center rounded-none rounded-tl-2xl pr-safe pb-safe',
                    )}
                    href={`/bible/${bible.abbreviation}/${chapter.next!.abbreviation.split('.')[0]}/${chapter.next!.number}`}
                  >
                    <ChevronRight size={20} class='shrink-0' />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{chapter.next!.name}</p>
                  </TooltipContent>
                </Tooltip>
              </Show>
            </div>
          </BibleReaderProvider>
        )}
      </QueryBoundary>
    </div>
  );
}
