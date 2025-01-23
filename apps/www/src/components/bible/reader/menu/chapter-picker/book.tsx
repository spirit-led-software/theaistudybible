import { db } from '@/core/database';
import { QueryBoundary } from '@/www/components/query-boundary';
import { Button } from '@/www/components/ui/button';
import { Command, CommandEmpty, CommandInput, CommandList } from '@/www/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/www/components/ui/popover';
import { useBibleReaderStore } from '@/www/contexts/bible-reader';
import { json } from '@solidjs/router';
import { GET } from '@solidjs/start';
import { createQuery } from '@tanstack/solid-query';
import { ChevronsUpDown } from 'lucide-solid';
import { murmurHash } from 'ohash';
import { For } from 'solid-js';
import { ChapterPicker } from './chapter';

const getBookPickerData = GET(async (bibleId: string) => {
  'use server';
  const bibleData = await db.query.bibles.findFirst({
    where: (bibles, { and, or, eq }) =>
      and(
        or(eq(bibles.abbreviation, bibleId), eq(bibles.id, bibleId)),
        eq(bibles.readyForPublication, true),
      ),
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

  const returnValue = { bible, books };
  return json(returnValue, {
    headers: {
      'Cache-Control': 'public,max-age=259200,s-maxage=604800,stale-while-revalidate=86400',
      ETag: murmurHash(JSON.stringify(returnValue)).toString(36),
    },
  });
});

export const bookPickerQueryOptions = (bibleId: string) => ({
  queryKey: ['book-picker', { bibleId }],
  queryFn: () => getBookPickerData(bibleId).then((data) => data.customBody()),
  staleTime: 1000 * 60 * 60, // 1 hour
});

export function BookPicker() {
  const [brStore] = useBibleReaderStore();
  const query = createQuery(() => bookPickerQueryOptions(brStore.bible.abbreviation));

  return (
    <Popover placement='bottom-start'>
      <PopoverTrigger
        as={Button}
        variant='outline'
        class='max-w-40 justify-between text-nowrap sm:max-w-[unset]'
      >
        <span class='truncate'>
          {brStore.book.shortName} {brStore.chapter.number}
          {brStore.verse ? `:${brStore.verse.number}` : ''}
        </span>
        <ChevronsUpDown class='ml-2 h-4 w-4 shrink-0 opacity-50' />
      </PopoverTrigger>
      <PopoverContent class='w-[250px] p-0'>
        <Command value={brStore.book.shortName}>
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
