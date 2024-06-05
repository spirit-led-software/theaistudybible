import { createQuery } from '@tanstack/solid-query';
import { ChevronsUpDown } from 'lucide-solid';
import { createSignal } from 'solid-js';
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

export const bookChapterPickerQueryOptions = ({
  bibleAbbr,
  bookAbbr,
  chapterNum
}: BookPickerProps) => ({
  queryKey: ['book-chapter-picker', { bibleAbbr, bookAbbr, chapterNum }],
  queryFn: () => getBookPickerData({ bibleAbbr, bookAbbr, chapterNum })
});

export default function BookPicker({ bibleAbbr, bookAbbr, chapterNum }: BookPickerProps) {
  const query = createQuery(() =>
    bookChapterPickerQueryOptions({ bibleAbbr, bookAbbr, chapterNum })
  );

  const [open, setOpen] = createSignal(false);

  return (
    <QueryBoundary query={query}>
      {({ book, chapter, books }) => (
        <Popover open={open()} onOpenChange={setOpen}>
          <PopoverTrigger
            as={() => (
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={open()}
                class="w-[200px] justify-between"
              >
                {book.shortName} {chapter.number}
                <ChevronsUpDown class="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            )}
          />
          <PopoverContent class="w-[200px] p-0">
            <Command>
              <CommandInput placeholder="Search books..." />
              <CommandList>
                <CommandEmpty>Not Found</CommandEmpty>
                {books.map((foundBook) => (
                  <ChapterPicker
                    bibleAbbr={bibleAbbr}
                    bookAbbr={foundBook.abbreviation}
                    chapterNum={chapter.number}
                  />
                ))}
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      )}
    </QueryBoundary>
  );
}
