import { db } from '@/core/database';
import { QueryBoundary } from '@/www/components/query-boundary';
import { H1, Muted } from '@/www/components/ui/typography';
import { useBibleStore } from '@/www/contexts/bible';
import { BibleReaderProvider } from '@/www/contexts/bible-reader';
import { useSwipe } from '@/www/hooks/use-swipe';
import { cn } from '@/www/lib/utils';
import { A, useIsRouting, useNavigate, usePreloadRoute } from '@solidjs/router';
import { GET } from '@solidjs/start';
import { createQuery } from '@tanstack/solid-query';
import { ChevronLeft, ChevronRight, Copyright } from 'lucide-solid';
import { Show } from 'solid-js';
import { createSignal } from 'solid-js';
import { setResponseHeader } from 'vinxi/http';
import { Button, buttonVariants } from '../../ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '../../ui/tooltip';
import { ReaderContent } from '../reader';
import { BibleReaderMenu } from '../reader/menu';

const getChapterReaderData = GET(
  async (props: {
    bibleAbbr: string;
    bookCode: string;
    chapterNum: number;
  }) => {
    'use server';
    const bibleData = await db.query.bibles.findFirst({
      where: (bibles, { eq }) => eq(bibles.abbreviation, props.bibleAbbr),
      with: {
        biblesToRightsHolders: { with: { rightsHolder: true } },
        books: {
          limit: 1,
          where: (books, { eq }) => eq(books.code, props.bookCode),
          with: {
            chapters: {
              limit: 1,
              where: (chapters, { eq }) => eq(chapters.number, props.chapterNum),
              with: {
                previous: { columns: { code: true, number: true, name: true } },
                next: { columns: { code: true, number: true, name: true } },
              },
            },
            previous: {
              columns: { id: true },
              with: {
                chapters: {
                  columns: { code: true, number: true, name: true },
                  orderBy: (chapters, { desc }) => desc(chapters.number),
                  limit: 1,
                },
              },
            },
            next: {
              columns: { id: true },
              with: {
                chapters: {
                  columns: { code: true, number: true, name: true },
                  orderBy: (chapters, { asc }) => asc(chapters.number),
                  limit: 1,
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

    const chapter = chapters[0];

    setResponseHeader(
      'Cache-Control',
      'public,max-age=259200,s-maxage=604800,stale-while-revalidate=86400',
    );
    return {
      bible,
      book,
      chapter,
      rightsHolder: biblesToRightsHolders[0].rightsHolder,
    };
  },
);

export const chapterReaderQueryOptions = (props: {
  bibleAbbr: string;
  bookCode: string;
  chapterNum: number;
}) => ({
  queryKey: ['chapter-reader', props],
  queryFn: () => getChapterReaderData(props),
  staleTime: 1000 * 60 * 60, // 1 hour
});

export type ChapterReaderProps = {
  bibleAbbr: string;
  bookCode: string;
  chapterNum: number;
};

export function ChapterReader(props: ChapterReaderProps) {
  const navigate = useNavigate();
  const isRouting = useIsRouting();
  const preload = usePreloadRoute();

  const [, setBibleStore] = useBibleStore();

  const query = createQuery(() =>
    chapterReaderQueryOptions({
      bibleAbbr: props.bibleAbbr,
      bookCode: props.bookCode,
      chapterNum: props.chapterNum,
    }),
  );

  const [containerRef, setContainerRef] = createSignal<HTMLDivElement>();

  return (
    <div
      class='flex h-full w-full max-w-3xl flex-1 flex-col justify-center py-5'
      ref={setContainerRef}
    >
      <QueryBoundary
        query={query}
        notFoundFallback={
          <div class='flex h-full w-full flex-1 flex-col place-items-center justify-center'>
            <H1>Chapter Not Found</H1>
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
        {({ bible, book, chapter, rightsHolder }) => {
          const previousChapter = chapter.previous ?? book.previous?.chapters[0];
          const previousChapterRoute = `/bible/${bible.abbreviation}/${previousChapter?.code.split('.')[0]}/${previousChapter?.number}`;

          const nextChapter = chapter.next ?? book.next?.chapters[0];
          const nextChapterRoute = `/bible/${bible.abbreviation}/${nextChapter?.code.split('.')[0]}/${nextChapter?.number}`;

          useSwipe(containerRef, {
            onSwipeLeft: () => {
              if (nextChapter && !isRouting()) {
                navigate(nextChapterRoute);
              }
            },
            onSwipeRight: () => {
              if (previousChapter && !isRouting()) {
                navigate(previousChapterRoute);
              }
            },
          });

          return (
            <BibleReaderProvider bible={bible} book={book} chapter={chapter}>
              <BibleReaderMenu />
              <div class='mt-10 h-full w-full flex-1 overflow-y-auto sm:px-10'>
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
                  <div innerHTML={bible.copyrightStatement} class='text-muted-foreground' />
                </div>
                <Show when={previousChapter} keyed>
                  {(previousChapter) => {
                    preload(previousChapterRoute, { preloadData: true });
                    return (
                      <Tooltip placement='right'>
                        <TooltipTrigger
                          as={A}
                          class={cn(
                            buttonVariants(),
                            'sm:-translate-y-1/2 fixed bottom-safe-offset-1 left-safe-offset-1 flex size-10 items-center justify-center rounded-full p-0 sm:top-1/2 md:left-safe-offset-2 md:size-12 lg:left-[12%] lg:size-14',
                            isRouting() && 'pointer-events-none opacity-50',
                          )}
                          href={previousChapterRoute}
                        >
                          <ChevronLeft />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>{previousChapter.name}</p>
                        </TooltipContent>
                      </Tooltip>
                    );
                  }}
                </Show>
                <Show when={nextChapter} keyed>
                  {(nextChapter) => {
                    preload(nextChapterRoute, { preloadData: true });
                    return (
                      <Tooltip placement='left'>
                        <TooltipTrigger
                          as={A}
                          class={cn(
                            buttonVariants(),
                            'sm:-translate-y-1/2 fixed right-safe-offset-1 bottom-safe-offset-1 flex size-10 items-center justify-center rounded-full p-0 sm:top-1/2 md:right-safe-offset-2 md:size-12 lg:right-[12%] lg:size-14',
                            isRouting() && 'pointer-events-none opacity-50',
                          )}
                          href={nextChapterRoute}
                        >
                          <ChevronRight />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>{nextChapter.name}</p>
                        </TooltipContent>
                      </Tooltip>
                    );
                  }}
                </Show>
              </div>
            </BibleReaderProvider>
          );
        }}
      </QueryBoundary>
    </div>
  );
}
