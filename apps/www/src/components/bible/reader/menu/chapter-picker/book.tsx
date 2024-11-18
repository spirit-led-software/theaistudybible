import { db } from '@/core/database';
import { QueryBoundary } from '@/www/components/query-boundary';
import { Button } from '@/www/components/ui/button';
import { Command, CommandEmpty, CommandInput, CommandList } from '@/www/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/www/components/ui/popover';
import { useBibleReaderStore } from '@/www/contexts/bible-reader';
import { json, query } from '@solidjs/router';
import { GET } from '@solidjs/start';
import { createQuery } from '@tanstack/solid-query';
import { ChevronsUpDown } from 'lucide-solid';
import { For } from 'solid-js';
import { ChapterPicker } from './chapter';

const getBookPickerData = query(async (bibleId: string) => {
  'use server';
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
}, 'book-picker');

const getBookPickerDataRequest = GET(async (bibleId: string) => {
  const data = await getBookPickerData(bibleId);
  return json(data, {
    headers: {
      'Cache-Control': 'public,max-age=86400,s-maxage=604800,stale-while-revalidate=86400',
    },
    revalidate: getBookPickerData.keyFor(bibleId),
  });
});

export const bookPickerQueryOptions = (bibleId: string) => ({
  queryKey: ['book-picker', { bibleId }],
  queryFn: async () => {
    const response = await getBookPickerDataRequest(bibleId);
    return (await response.json()) as Awaited<ReturnType<typeof getBookPickerData>>;
  },
  staleTime: 1000 * 60 * 60, // 1 hour
});

export function BookPicker() {
  const [brStore] = useBibleReaderStore();
  const query = createQuery(() => bookPickerQueryOptions(brStore.bible.abbreviation));

  return (
    <Popover>
      <PopoverTrigger as={Button} variant='outline' class='justify-between text-nowrap'>
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
