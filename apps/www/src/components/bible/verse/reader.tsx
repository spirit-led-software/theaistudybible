import { db } from '@/core/database';
import { QueryBoundary } from '@/www/components/query-boundary';
import { H1, Muted } from '@/www/components/ui/typography';
import { useBibleStore } from '@/www/contexts/bible';
import { BibleReaderProvider } from '@/www/contexts/bible-reader';
import { cn } from '@/www/lib/utils';
import { A, useNavigate } from '@solidjs/router';
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

  const { verses, ...chapter } = chapters[0];
  if (!verses[0]) {
    throw new Error('Verse not found');
  }
  const verse = verses[0];

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
  const navigate = useNavigate();

  const [, setBibleStore] = useBibleStore();

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
      <QueryBoundary
        query={query}
        notFoundFallback={(retry) => (
          <div class='flex h-full w-full flex-1 flex-col place-items-center justify-center'>
            <H1>Verse Not Found</H1>
            <div class='flex items-center gap-2'>
              <Button onClick={retry}>Retry</Button>
              <Button
                onClick={() => {
                  setBibleStore({
                    bible: undefined,
                    book: undefined,
                    chapter: undefined,
                    verse: undefined,
                  });
                  navigate(`/bible/${props.bibleAbbr}`);
                }}
              >
                Go to beginning
              </Button>
            </div>
          </div>
        )}
      >
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
                <div innerHTML={bible.copyrightStatement} class='text-muted-foreground' />
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
                <Tooltip placement='right'>
                  <TooltipTrigger
                    as={A}
                    class={cn(
                      buttonVariants(),
                      'fixed bottom-0 left-0 my-auto flex h-20 w-8 flex-col place-items-center justify-center rounded-none rounded-tr-2xl pb-safe pl-safe',
                    )}
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
              </Show>
              <Show when={verse.next}>
                <Tooltip placement='left'>
                  <TooltipTrigger
                    as={A}
                    class={cn(
                      buttonVariants(),
                      'fixed right-0 bottom-0 my-auto flex h-20 w-8 flex-col place-items-center justify-center rounded-none rounded-tl-2xl pr-safe pb-safe',
                    )}
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
              </Show>
            </div>
          </BibleReaderProvider>
        )}
      </QueryBoundary>
    </div>
  );
}
