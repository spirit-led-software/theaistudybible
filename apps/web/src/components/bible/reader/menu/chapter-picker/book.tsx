import { createQuery } from '@tanstack/solid-query';
import { ChevronsUpDown } from 'lucide-solid';
import { For } from 'solid-js';
import { useBibleReaderStore } from '~/components/providers/bible-reader';
import { QueryBoundary } from '~/components/query-boundary';
import { Button } from '~/components/ui/button';
import { Command, CommandEmpty, CommandInput, CommandList } from '~/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '~/components/ui/popover';
import ChapterPicker from './chapter';
import { getBookPickerData } from './server';

export const bookPickerQueryOptions = (bibleId: string) => ({
  queryKey: ['book-picker', { bibleId }],
  queryFn: () => getBookPickerData(bibleId)
});

export default function BookPicker() {
  const [brStore] = useBibleReaderStore();
  const query = createQuery(() => bookPickerQueryOptions(brStore.bible.abbreviation));

  return (
    <Popover>
      <PopoverTrigger
        as={Button}
        variant="outline"
        role="combobox"
        class="justify-between text-nowrap"
      >
        {brStore.book.shortName} {brStore.chapter.number}
        <ChevronsUpDown class="ml-2 h-4 w-4 shrink-0 opacity-50" />
      </PopoverTrigger>
      <PopoverContent class="w-[200px] p-0">
        <Command>
          <CommandInput placeholder="Search books..." />
          <QueryBoundary query={query}>
            {(books) => (
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
