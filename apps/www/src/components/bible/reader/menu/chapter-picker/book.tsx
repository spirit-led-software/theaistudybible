import { db } from '@/core/database';
import { QueryBoundary } from '@/www/components/query-boundary';
import { Button } from '@/www/components/ui/button';
import { Command, CommandEmpty, CommandInput, CommandList } from '@/www/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/www/components/ui/popover';
import { useBibleReaderStore } from '@/www/contexts/bible-reader';
import { serverFn } from '@/www/server/server-fn';
import { createQuery } from '@tanstack/solid-query';
import { ChevronsUpDown } from 'lucide-solid';
import { For } from 'solid-js';
import ChapterPicker from './chapter';

const getBookPickerData = serverFn(async (bibleId: string) => {
  const bibleData = await db.query.bibles.findFirst({
    where: (bibles, { or, eq }) => or(eq(bibles.abbreviation, bibleId), eq(bibles.id, bibleId)),
    with: {
      books: {
        orderBy: (books, { asc }) => asc(books.number),
        columns: { code: true, shortName: true },
      },
    },
  });
  if (!bibleData) {
    throw new Error('Bible not found');
  }

  const { books, ...bible } = bibleData;

  return {
    bible,
    books,
  };
});

export const bookPickerQueryOptions = (bibleId: string) => ({
  queryKey: ['book-picker', { bibleId }],
  queryFn: () => getBookPickerData(bibleId),
});

export default function BookPicker() {
  const [brStore] = useBibleReaderStore();
  const query = createQuery(() => bookPickerQueryOptions(brStore.bible.abbreviation));

  return (
    <Popover>
      <PopoverTrigger
        as={Button}
        variant='outline'
        role='combobox'
        class='justify-between text-nowrap'
      >
        {brStore.book.shortName} {brStore.chapter.number}
        <ChevronsUpDown class='ml-2 h-4 w-4 shrink-0 opacity-50' />
      </PopoverTrigger>
      <PopoverContent class='w-[200px] p-0'>
        <Command>
          <CommandInput placeholder='Search books...' />
          <QueryBoundary query={query}>
            {({ books }) => (
              <CommandList>
                <CommandEmpty>Not Found</CommandEmpty>
                <For each={books}>{(book) => <ChapterPicker book={book} />}</For>
              </CommandList>
            )}
          </QueryBoundary>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
