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

const getVerseReaderData = async (props: {
  bibleAbbr: string;
  bookAbbr: string;
  chapterNum: number;
  verseNum: number;
}) => {
  'use server';
  const bibleBookChapterVerse = await db.query.bibles.findFirst({
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
            with: {
              verses: {
                limit: 1,
                where: (verses, { eq }) => eq(verses.number, props.verseNum),
                with: { previous: true, next: true },
              },
            },
          },
        },
      },
    },
  });
  if (!bibleBookChapterVerse) {
    throw new Error('Insufficient data');
  }

  const { books, biblesToRightsHolders, ...bible } = bibleBookChapterVerse;
  const { chapters, ...book } = books[0];
  const { verses, ...chapter } = chapters[0];
  const verse = verses[0];

  if (!bibleBookChapterVerse || !book || !chapter || !verse) {
    throw new Error('Insufficient data');
  }

  return {
    bible,
    book,
    chapter,
    verse,
    rightsHolder: biblesToRightsHolders[0].rightsHolder,
  };
};

export const getVerseReaderQueryOptions = (props: {
  bibleAbbr: string;
  bookAbbr: string;
  chapterNum: number;
  verseNum: number;
}) => ({
  queryKey: ['verse-reader', props],
  queryFn: () => getVerseReaderData(props),
});

export type VerseReaderProps = {
  bibleAbbr: string;
  bookAbbr: string;
  chapterNum: number;
  verseNum: number;
};

export default function VerseReader(props: VerseReaderProps) {
  const query = createQuery(() =>
    getVerseReaderQueryOptions({
      bibleAbbr: props.bibleAbbr,
      bookAbbr: props.bookAbbr,
      chapterNum: props.chapterNum,
      verseNum: props.verseNum,
    }),
  );

  return (
    <div class='flex max-w-3xl flex-col items-center px-8 py-5'>
      <QueryBoundary query={query}>
        {({ bible, book, chapter, verse, rightsHolder }) => (
          <BibleReaderProvider bible={bible} book={book} chapter={chapter} verse={verse}>
            <BibleReaderMenu />
            <div class='mt-10'>
              <div class='flex w-full justify-center'>
                <H1 class='inline-block bg-gradient-to-r from-primary to-accent-foreground bg-clip-text text-transparent dark:from-accent-foreground dark:to-secondary-foreground'>
                  {verse.name}
                </H1>
              </div>
              <div class='mt-10 mb-5'>
                <ReaderContent contents={verse.content} />
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
              <div class='flex w-full flex-col items-center'>
                <Button
                  as={A}
                  href={`/bible/${bible.abbreviation}/${book.abbreviation}/${chapter.number}`}
                  variant='outline'
                >
                  More from {book.shortName} {chapter.number}
                </Button>
              </div>
              <Show when={verse.previous}>
                <div class='fixed bottom-0 left-0 flex flex-col place-items-center justify-center'>
                  <Tooltip placement='right'>
                    <TooltipTrigger
                      as={A}
                      class={cn(buttonVariants(), 'my-auto h-10 w-5 rounded-none rounded-tr-2xl')}
                      href={
                        `/bible/${bible.abbreviation}/${verse.previous!.abbreviation.split('.')[0]}` +
                        `/${verse.previous!.abbreviation.split('.')[1]}/${verse.previous!.number}`
                      }
                    >
                      <ChevronLeft size={20} class='shrink-0' />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{verse.previous!.name}</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
              </Show>
              <Show when={verse.next}>
                <div class='fixed right-0 bottom-0 flex flex-col place-items-center justify-center'>
                  <Tooltip placement='left'>
                    <TooltipTrigger
                      as={A}
                      class={cn(buttonVariants(), 'my-auto h-10 w-5 rounded-none rounded-tl-2xl')}
                      href={
                        `/bible/${bible.abbreviation}/${verse.next!.abbreviation.split('.')[0]}` +
                        `/${verse.next!.abbreviation.split('.')[1]}/${verse.next!.number}`
                      }
                    >
                      <ChevronRight size={20} class='shrink-0' />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{verse.next!.name}</p>
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
