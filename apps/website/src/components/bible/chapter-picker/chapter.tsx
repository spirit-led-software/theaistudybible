import { A } from '@solidjs/router';
import { createQuery } from '@tanstack/solid-query';
import { Check } from 'lucide-solid';
import { QueryBoundary } from '../../query-boundary';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../../ui/accordion';
import { Button } from '../../ui/button';
import { CommandItem } from '../../ui/command';
import { getChapterPickerData } from './server';

export type ChapterPickerProps = {
  bibleAbbr: string;
  bookAbbr: string;
  chapterNum: number;
};

export const chapterPickerQueryOptions = ({
  bibleAbbr,
  bookAbbr,
  chapterNum
}: ChapterPickerProps) => ({
  queryKey: ['chapter-picker', { bibleAbbr, bookAbbr, chapterNum }],
  queryFn: () => getChapterPickerData({ bibleAbbr, bookAbbr, chapterNum })
});

export default function ChapterPicker({ bibleAbbr, bookAbbr, chapterNum }: ChapterPickerProps) {
  const query = createQuery(() => chapterPickerQueryOptions({ bibleAbbr, bookAbbr, chapterNum }));

  return (
    <QueryBoundary query={query}>
      {({ book, chapter }) => (
        <CommandItem value={book.shortName} class="aria-selected:bg-background">
          <Accordion collapsible class="w-full">
            <AccordionItem value={book.abbreviation} onClick={() => !query.data && query.refetch()}>
              <AccordionTrigger>{book.shortName}</AccordionTrigger>
              <AccordionContent class="grid grid-cols-3 gap-1">
                {book.chapters.map((foundChapter) => (
                  <Button
                    variant="outline"
                    as={A}
                    href={`/bible/${bibleAbbr}/${bookAbbr}/${foundChapter.number}`}
                    class="flex place-items-center justify-center overflow-visible"
                  >
                    <Check
                      size={10}
                      class={`mr-1 h-4 w-4 flex-shrink-0 ${foundChapter.id === chapter.id ? '' : 'hidden'}`}
                    />
                    {foundChapter.number}
                  </Button>
                ))}
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </CommandItem>
      )}
    </QueryBoundary>
  );
}
