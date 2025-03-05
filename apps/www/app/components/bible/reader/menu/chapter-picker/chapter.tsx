import { db } from '@/core/database';
import type { Book } from '@/schemas/bibles/types';
import { QueryBoundary } from '@/www/components/query-boundary';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/www/components/ui/accordion';
import { Button } from '@/www/components/ui/button';
import { CommandItem } from '@/www/components/ui/command';
import { Skeleton } from '@/www/components/ui/skeleton';
import { useBibleReaderStore } from '@/www/contexts/bible-reader';
import { cn } from '@/www/lib/utils';
import { A } from '@solidjs/router';
import { GET } from '@solidjs/start';
import { createQuery } from '@tanstack/solid-query';
import { Check } from 'lucide-solid';
import { For } from 'solid-js';

const getChapterPickerData = GET(async (input: { bibleAbbreviation: string; bookCode: string }) => {
  'use server';
  const bibleData = await db.query.bibles.findFirst({
    where: (bibles, { and, eq }) =>
      and(eq(bibles.abbreviation, input.bibleAbbreviation), eq(bibles.readyForPublication, true)),
    columns: { abbreviation: true },
    with: {
      books: {
        limit: 1,
        where: (books, { eq }) => eq(books.code, input.bookCode),
        columns: { code: true },
        with: {
          chapters: {
            orderBy: (chapters, { asc }) => asc(chapters.number),
            columns: { code: true, number: true },
          },
        },
      },
    },
  });

  if (!bibleData) {
    throw new Error('Bible not found');
  }

  const { books, ...bible } = bibleData;
  if (!books[0]) {
    throw new Error('Book not found');
  }

  const { chapters, ...book } = books[0];

  return { bible, book, chapters };
});

export const chapterPickerQueryOptions = (input: {
  bibleAbbreviation: string;
  bookCode: string;
}) => ({
  queryKey: ['chapter-picker', input],
  queryFn: () => getChapterPickerData(input),
  staleTime: 1000 * 60 * 60, // 1 hour
});

export type ChapterPickerProps = {
  book: Pick<Book, 'code' | 'shortName'>;
};

export function ChapterPicker(props: ChapterPickerProps) {
  const [brStore] = useBibleReaderStore();

  const query = createQuery(() => ({
    ...chapterPickerQueryOptions({
      bibleAbbreviation: brStore.bible.abbreviation,
      bookCode: props.book.code,
    }),
  }));

  return (
    <CommandItem value={props.book.shortName} className='aria-selected:bg-background'>
      <Accordion collapsible className='w-full'>
        <AccordionItem value={props.book.code}>
          <AccordionTrigger>{props.book.shortName}</AccordionTrigger>
          <AccordionContent className='grid grid-cols-4 gap-1'>
            <QueryBoundary
              loadingFallback={
                <For each={Array(24)}>
                  {() => <Skeleton width={48} height={48} className='rounded-lg' />}
                </For>
              }
              query={query}
            >
              {({ book, chapters }) => (
                <For each={chapters}>
                  {(foundChapter, idx) => (
                    <Button
                      data-index={idx()}
                      variant='outline'
                      as={A}
                      href={`/bible/${brStore.bible.abbreviation}/${book.code}/${foundChapter.number}`}
                      className='flex place-items-center justify-center overflow-visible'
                    >
                      <Check
                        size={10}
                        className={cn(
                          'mr-1 h-4 w-4 shrink-0',
                          foundChapter.code !== brStore.chapter.code && 'hidden',
                        )}
                      />
                      {foundChapter.number}
                    </Button>
                  )}
                </For>
              )}
            </QueryBoundary>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </CommandItem>
  );
}
