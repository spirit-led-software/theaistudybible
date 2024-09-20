import { db } from '@/core/database';
import type { Book } from '@/schemas/bibles';
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
import { A } from '@solidjs/router';
import { createQuery } from '@tanstack/solid-query';
import { Check } from 'lucide-solid';
import { For } from 'solid-js';

type GetChapterPickerDataProps = {
  bibleAbbr: string;
  bookAbbr: string;
};

async function getChapterPickerData({ bibleAbbr, bookAbbr }: GetChapterPickerDataProps) {
  'use server';
  const bibleData = await db.query.bibles.findFirst({
    where: (bibles, { eq }) => eq(bibles.abbreviation, bibleAbbr),
    columns: { id: true },
    with: {
      books: {
        limit: 1,
        where: (books, { eq }) => eq(books.abbreviation, bookAbbr),
        columns: { abbreviation: true },
        with: {
          chapters: {
            orderBy: (chapters, { asc }) => asc(chapters.number),
            columns: { id: true, number: true },
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

  return {
    bible,
    book,
    chapters,
  };
}

export const chapterPickerQueryOptions = (props: GetChapterPickerDataProps) => ({
  queryKey: ['chapter-picker', props],
  queryFn: () => getChapterPickerData(props),
});

export type ChapterPickerProps = {
  book: Pick<Book, 'abbreviation' | 'shortName'>;
};

export default function ChapterPicker(props: ChapterPickerProps) {
  const [brStore] = useBibleReaderStore();

  const query = createQuery(() => ({
    ...chapterPickerQueryOptions({
      bibleAbbr: brStore.bible.abbreviation,
      bookAbbr: props.book.abbreviation,
    }),
  }));

  return (
    <CommandItem value={props.book.shortName} class='aria-selected:bg-background'>
      <Accordion collapsible class='w-full'>
        <AccordionItem
          value={props.book.abbreviation}
          onMouseEnter={() => !query.data && query.refetch()}
          onClick={() => !query.data && query.refetch()}
        >
          <AccordionTrigger>{props.book.shortName}</AccordionTrigger>
          <AccordionContent class='grid grid-cols-3 gap-1'>
            <QueryBoundary
              loadingFallback={
                <For each={Array(24)}>
                  {() => <Skeleton width={48} height={48} class='rounded-lg' />}
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
                      href={`/bible/${brStore.bible.abbreviation}/${book.abbreviation}/${foundChapter.number}`}
                      class='flex place-items-center justify-center overflow-visible'
                    >
                      <Check
                        size={10}
                        class={`mr-1 h-4 w-4 flex-shrink-0 ${foundChapter.id === brStore.chapter.id ? '' : 'hidden'}`}
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
