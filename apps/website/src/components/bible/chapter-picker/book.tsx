import { createQuery } from '@tanstack/solid-query';
import { ChevronsUpDown } from 'lucide-solid';
import { QueryBoundary } from '../../query-boundary';
import { Button } from '../../ui/button';
import { Command, CommandEmpty, CommandInput, CommandList } from '../../ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '../../ui/popover';
import ChapterPicker from './chapter';
import { getBookPickerData } from './server';

export type BookPickerProps = {
  bibleAbbr: string;
  bookAbbr: string;
  chapterNum: number;
};

export const bookPickerQueryOptions = (props: BookPickerProps) => ({
  queryKey: ['book-chapter-picker', props],
  queryFn: () => getBookPickerData(props)
});

export default function BookPicker(props: BookPickerProps) {
  const query = createQuery(() => bookPickerQueryOptions(props));

  return (
    <QueryBoundary query={query}>
      {({ bible, book, chapter, books }) => (
        <Popover>
          <PopoverTrigger
            as={Button}
            variant="outline"
            role="combobox"
            class="w-[200px] justify-between"
          >
            {book.shortName} {chapter.number}
            <ChevronsUpDown class="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </PopoverTrigger>
          <PopoverContent class="w-[200px] p-0">
            <Command>
              <CommandInput placeholder="Search books..." />
              <CommandList>
                <CommandEmpty>Not Found</CommandEmpty>
                {books.map((foundBook) => (
                  <ChapterPicker bible={bible} book={foundBook} chapter={chapter} />
                ))}
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      )}
    </QueryBoundary>
  );
}
