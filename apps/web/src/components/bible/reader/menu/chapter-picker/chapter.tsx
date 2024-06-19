import { A } from '@solidjs/router';
import { createQuery } from '@tanstack/solid-query';
import type { Book } from '@theaistudybible/core/model/bible';
import { Check } from 'lucide-solid';
import { For } from 'solid-js';
import { useBibleReaderStore } from '~/components/providers/bible-reader';
import { QueryBoundary } from '~/components/query-boundary';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger
} from '~/components/ui/accordion';
import { Button } from '~/components/ui/button';
import { CommandItem } from '~/components/ui/command';
import { GetChapterPickerDataProps, getChapterPickerData } from './server';

export type ChapterPickerProps = {
  book: Book;
};

export const chapterPickerQueryOptions = (props: GetChapterPickerDataProps) => ({
  queryKey: ['chapter-picker', props],
  queryFn: () => getChapterPickerData(props)
});

export default function ChapterPicker(props: ChapterPickerProps) {
  const [brStore] = useBibleReaderStore();

  const query = createQuery(() => ({
    ...chapterPickerQueryOptions({
      bibleAbbr: brStore.bible.abbreviation,
      bookAbbr: props.book.abbreviation
    })
  }));

  return (
    <CommandItem value={props.book.shortName} class="aria-selected:bg-background">
      <Accordion collapsible class="w-full">
        <AccordionItem
          value={props.book.abbreviation}
          onMouseEnter={() => !query.data && query.refetch()}
          onClick={() => !query.data && query.refetch()}
        >
          <AccordionTrigger>{props.book.shortName}</AccordionTrigger>
          <AccordionContent class="grid grid-cols-3 gap-1">
            <QueryBoundary query={query}>
              {(book) => (
                <For each={book.chapters}>
                  {(foundChapter, idx) => (
                    <Button
                      data-index={idx()}
                      variant="outline"
                      as={A}
                      href={`/bible/${brStore.bible.abbreviation}/${book.abbreviation}/${foundChapter.number}`}
                      class="flex place-items-center justify-center overflow-visible"
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