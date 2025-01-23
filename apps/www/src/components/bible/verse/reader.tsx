import { db } from '@/core/database';
import { QueryBoundary } from '@/www/components/query-boundary';
import { H1, Muted } from '@/www/components/ui/typography';
import { useBibleStore } from '@/www/contexts/bible';
import { BibleReaderProvider } from '@/www/contexts/bible-reader';
import { useSwipe } from '@/www/hooks/use-swipe';
import { cn } from '@/www/lib/utils';
import { A, json, useIsRouting, useNavigate, usePreloadRoute } from '@solidjs/router';
import { GET } from '@solidjs/start';
import { createQuery } from '@tanstack/solid-query';
import { formatISO } from 'date-fns';
import { ChevronLeft, ChevronRight, Copyright } from 'lucide-solid';
import { murmurHash } from 'ohash';
import { Show } from 'solid-js';
import { createSignal } from 'solid-js';
import { Button, buttonVariants } from '../../ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '../../ui/tooltip';
import { ReaderContent } from '../reader';
import { BibleReaderMenu } from '../reader/menu';

const getVerseReaderData = GET(
  async (props: {
    bibleAbbr: string;
    bookCode: string;
    chapterNum: number;
    verseNum: number;
  }) => {
    'use server';
    const bibleData = await db.query.bibles.findFirst({
      where: (bibles, { and, eq }) =>
        and(eq(bibles.abbreviation, props.bibleAbbr), eq(bibles.readyForPublication, true)),
      with: {
        biblesToRightsHolders: { with: { rightsHolder: true } },
        books: {
          limit: 1,
          where: (books, { eq }) => eq(books.code, props.bookCode),
          with: {
            chapters: {
              columns: { content: false },
              limit: 1,
              where: (chapters, { eq }) => eq(chapters.number, props.chapterNum),
              with: {
                verses: {
                  limit: 1,
                  where: (verses, { eq }) => eq(verses.number, props.verseNum),
                  with: {
                    previous: { columns: { code: true, number: true, name: true } },
                    next: { columns: { code: true, number: true, name: true } },
                  },
                },
                previous: {
                  columns: { id: true },
                  with: {
                    verses: {
                      columns: { code: true, number: true, name: true },
                      orderBy: (verses, { desc }) => desc(verses.number),
                      limit: 1,
                    },
                  },
                },
                next: {
                  columns: { id: true },
                  with: {
                    verses: {
                      columns: { code: true, number: true, name: true },
                      orderBy: (verses, { asc }) => asc(verses.number),
                      limit: 1,
                    },
                  },
                },
              },
            },
            previous: {
              columns: { id: true },
              with: {
                chapters: {
                  columns: { id: true, number: true },
                  orderBy: (chapters, { desc }) => desc(chapters.number),
                  with: {
                    verses: {
                      columns: { code: true, number: true, name: true },
                      orderBy: (verses, { desc }) => desc(verses.number),
                      limit: 1,
                    },
                  },
                },
              },
            },
            next: {
              columns: { id: true },
              with: {
                chapters: {
                  columns: { id: true, number: true },
                  orderBy: (chapters, { asc }) => asc(chapters.number),
                  with: {
                    verses: {
                      columns: { code: true, number: true, name: true },
                      orderBy: (verses, { asc }) => asc(verses.number),
                      limit: 1,
                    },
                  },
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

    const returnValue = {
      bible,
      book,
      chapter,
      verse,
      rightsHolder: biblesToRightsHolders[0].rightsHolder,
    };
    return json(returnValue, {
      headers: {
        'Last-Modified': formatISO(verse.updatedAt),
        ETag: murmurHash(JSON.stringify(returnValue)).toString(36),
        'Cache-Control': 'public,max-age=259200,s-maxage=604800,stale-while-revalidate=86400',
      },
    });
  },
);

export const getVerseReaderQueryOptions = (props: {
  bibleAbbr: string;
  bookCode: string;
  chapterNum: number;
  verseNum: number;
}) => ({
  queryKey: ['verse-reader', props],
  queryFn: () => getVerseReaderData(props).then((data) => data.customBody()),
  staleTime: 1000 * 60 * 60, // 1 hour
});

export type VerseReaderProps = {
  bibleAbbr: string;
  bookCode: string;
  chapterNum: number;
  verseNum: number;
};

export function VerseReader(props: VerseReaderProps) {
  const navigate = useNavigate();
  const isRouting = useIsRouting();
  const preload = usePreloadRoute();

  const [, setBibleStore] = useBibleStore();

  const [containerRef, setContainerRef] = createSignal<HTMLDivElement>();

  const query = createQuery(() =>
    getVerseReaderQueryOptions({
      bibleAbbr: props.bibleAbbr,
      bookCode: props.bookCode,
      chapterNum: props.chapterNum,
      verseNum: props.verseNum,
    }),
  );

  return (
    <div
      class='flex h-full w-full max-w-3xl flex-1 flex-col justify-center py-5'
      ref={setContainerRef}
    >
      <QueryBoundary
        query={query}
        notFoundFallback={
          <div class='flex h-full w-full flex-1 flex-col place-items-center justify-center'>
            <H1>Verse Not Found</H1>
            <div class='flex items-center gap-2'>
              <Button
                onClick={() => {
                  setBibleStore({
                    bible: undefined,
                    book: undefined,
                    chapter: undefined,
                    verse: undefined,
                  });
                  navigate('/bible');
                }}
              >
                View other bibles
              </Button>
            </div>
          </div>
        }
      >
        {({ bible, book, chapter, verse, rightsHolder }) => {
          const previousVerse =
            verse.previous ?? chapter.previous?.verses[0] ?? book.previous?.chapters[0]?.verses[0];
          const previousVerseRoute =
            `/bible/${bible.abbreviation}/${previousVerse?.code.split('.')[0]}` +
            `/${previousVerse?.code.split('.')[1]}/${previousVerse?.number}`;

          const nextVerse =
            verse.next ?? chapter.next?.verses[0] ?? book.next?.chapters[0]?.verses[0];
          const nextVerseRoute =
            `/bible/${bible.abbreviation}/${nextVerse?.code.split('.')[0]}` +
            `/${nextVerse?.code.split('.')[1]}/${nextVerse?.number}`;

          useSwipe(containerRef, {
            onSwipeLeft: () => {
              if (nextVerse && !isRouting()) {
                navigate(nextVerseRoute);
              }
            },
            onSwipeRight: () => {
              if (previousVerse && !isRouting()) {
                navigate(previousVerseRoute);
              }
            },
          });

          return (
            <BibleReaderProvider bible={bible} book={book} chapter={chapter} verse={verse}>
              <BibleReaderMenu />
              <div class='mt-12 mb-5'>
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
                    target='_blank'
                    class='p-0 text-muted-foreground'
                  >
                    {rightsHolder.nameLocal}
                  </Button>
                </Muted>
                <div
                  innerHTML={bible.copyrightStatement}
                  class='flex flex-col items-center text-center text-muted-foreground text-xs'
                />
              </div>
              <div class='flex w-full flex-col items-center'>
                <Button
                  as={A}
                  href={`/bible/${bible.abbreviation}/${book.code}/${chapter.number}`}
                  variant='outline'
                >
                  View all of <strong>{chapter.name}</strong>
                </Button>
              </div>
              <Show when={previousVerse} keyed>
                {(previousVerse) => {
                  preload(previousVerseRoute, { preloadData: true });
                  return (
                    <Tooltip placement='right'>
                      <TooltipTrigger
                        as={A}
                        class={cn(
                          buttonVariants(),
                          'sm:-translate-y-1/2 fixed bottom-safe-offset-1 left-safe-offset-1 flex size-10 items-center justify-center rounded-full p-0 sm:top-1/2 md:left-safe-offset-2 md:size-12 lg:left-[12%] lg:size-14',
                          isRouting() && 'pointer-events-none opacity-50',
                        )}
                        href={previousVerseRoute}
                      >
                        <ChevronLeft size={20} class='shrink-0' />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{previousVerse.name}</p>
                      </TooltipContent>
                    </Tooltip>
                  );
                }}
              </Show>
              <Show when={nextVerse} keyed>
                {(nextVerse) => {
                  preload(nextVerseRoute, { preloadData: true });
                  return (
                    <Tooltip placement='left'>
                      <TooltipTrigger
                        as={A}
                        class={cn(
                          buttonVariants(),
                          'sm:-translate-y-1/2 fixed right-safe-offset-1 bottom-safe-offset-1 flex size-10 items-center justify-center rounded-full p-0 sm:top-1/2 md:right-safe-offset-2 md:size-12 lg:right-[12%] lg:size-14',
                          isRouting() && 'pointer-events-none opacity-50',
                        )}
                        href={nextVerseRoute}
                      >
                        <ChevronRight size={20} class='shrink-0' />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{nextVerse.name}</p>
                      </TooltipContent>
                    </Tooltip>
                  );
                }}
              </Show>
            </BibleReaderProvider>
          );
        }}
      </QueryBoundary>
    </div>
  );
}
