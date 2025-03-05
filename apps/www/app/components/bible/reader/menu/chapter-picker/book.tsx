import { db } from '@/core/database';
import { QueryBoundary } from '@/www/components/query-boundary';
import { Button, type ButtonProps } from '@/www/components/ui/button';
import { Command, CommandEmpty, CommandInput, CommandList } from '@/www/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/www/components/ui/popover';
import { useBibleReaderStore } from '@/www/contexts/bible-reader';
import { cn } from '@/www/lib/utils';
import { GET } from '@solidjs/start';
import { createQuery } from '@tanstack/solid-query';
import { ChevronsUpDown } from 'lucide-solid';
import { For, splitProps } from 'solid-js';
import { ChapterPicker } from './chapter';

const getBookPickerData = GET(async (bibleAbbreviation: string) => {
  'use server';
  const bibleData = await db.query.bibles.findFirst({
    where: (bibles, { and, eq }) =>
      and(eq(bibles.abbreviation, bibleAbbreviation), eq(bibles.readyForPublication, true)),
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

  return { bible, books };
});

export const bookPickerQueryOptions = (bibleAbbreviation: string) => ({
  queryKey: ['book-picker', { bibleAbbreviation }],
  queryFn: () => getBookPickerData(bibleAbbreviation),
  staleTime: 1000 * 60 * 60, // 1 hour
});

export type BookPickerProps = Omit<ButtonProps, 'children'>;

export function BookPicker(props: BookPickerProps) {
  const [local, rest] = splitProps(props, ['class']);
  const [brStore] = useBibleReaderStore();
  const query = createQuery(() => bookPickerQueryOptions(brStore.bible.abbreviation));

  return (
    <Popover placement='bottom-start'>
      <PopoverTrigger
        as={Button}
        variant='outline'
        className={cn('justify-between text-nowrap', local.class)}
        {...rest}
      >
        <span className='truncate'>
          {brStore.book.shortName} {brStore.chapter.number}
          {brStore.verse ? `:${brStore.verse.number}` : ''}
        </span>
        <ChevronsUpDown className='ml-2 h-4 w-4 shrink-0 opacity-50' />
      </PopoverTrigger>
      <PopoverContent className='w-[250px] p-0'>
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
