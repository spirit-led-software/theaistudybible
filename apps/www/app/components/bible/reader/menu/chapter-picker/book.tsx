import { db } from '@/core/database';
import { QueryBoundary } from '@/www/components/query-boundary';
import { Button } from '@/www/components/ui/button';
import { Command, CommandEmpty, CommandInput, CommandList } from '@/www/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/www/components/ui/popover';
import { useBibleReaderStore } from '@/www/contexts/bible-reader';
import { cn } from '@/www/lib/utils';
import { useQuery } from '@tanstack/react-query';
import { createServerFn } from '@tanstack/react-start';
import { ChevronsUpDown } from 'lucide-react';
import { z } from 'zod';
import { ChapterPicker } from './chapter';

const getBookPickerData = createServerFn({ method: 'GET' })
  .validator(
    z.object({
      bibleAbbreviation: z.string(),
    }),
  )
  .handler(async ({ data }) => {
    const bibleData = await db.query.bibles.findFirst({
      where: (bibles, { and, eq }) =>
        and(eq(bibles.abbreviation, data.bibleAbbreviation), eq(bibles.readyForPublication, true)),
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
  queryFn: () => getBookPickerData({ data: { bibleAbbreviation } }),
  staleTime: 1000 * 60 * 60, // 1 hour
});

export type BookPickerProps = Omit<React.ComponentProps<typeof Button>, 'children'>;

export function BookPicker({ className, ...props }: BookPickerProps) {
  const brStore = useBibleReaderStore((s) => ({
    book: s.book,
    chapter: s.chapter,
    verse: s.verse,
    bible: s.bible,
  }));
  const query = useQuery(bookPickerQueryOptions(brStore.bible.abbreviation));

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant='outline'
          className={cn('justify-between text-nowrap', className)}
          {...props}
        >
          <span className='truncate'>
            {brStore.book.shortName} {brStore.chapter.number}
            {brStore.verse ? `:${brStore.verse.number}` : ''}
          </span>
          <ChevronsUpDown className='ml-2 h-4 w-4 shrink-0 opacity-50' />
        </Button>
      </PopoverTrigger>
      <PopoverContent side='bottom' className='w-[250px] p-0'>
        <Command value={brStore.book.shortName}>
          <CommandInput placeholder='Search books...' />
          <QueryBoundary query={query}>
            {({ books }) => (
              <CommandList>
                <CommandEmpty>Not Found</CommandEmpty>
                {books.map((book) => (
                  <ChapterPicker key={book.code} book={book} />
                ))}
              </CommandList>
            )}
          </QueryBoundary>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
