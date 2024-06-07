import { useNavigate } from '@solidjs/router';
import { createQuery } from '@tanstack/solid-query';
import ISO6391 from 'iso-639-1';
import { Check, ChevronsUpDown } from 'lucide-solid';
import { QueryBoundary } from '../../query-boundary';
import { Button } from '../../ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList
} from '../../ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '../../ui/popover';
import { getSmallPickerData } from './server';

export type SmallTranslationPickerProps = {
  bibleAbbr: string;
  bookAbbr: string;
  chapterNum: number;
};

export const smallTranslationPickerQueryOptions = (props: SmallTranslationPickerProps) => ({
  queryKey: ['small-translation-picker', props],
  queryFn: () => getSmallPickerData(props)
});

export default function SmallTranslationPicker(props: SmallTranslationPickerProps) {
  const query = createQuery(() => smallTranslationPickerQueryOptions(props));
  const navigate = useNavigate();

  const uniqueLanguages = query.data?.bibles.reduce((acc, bible) => {
    if (!acc.some((language) => language === bible.languageISO)) {
      acc.push(bible.languageISO);
    }
    return acc;
  }, [] as string[]);

  return (
    <QueryBoundary query={query}>
      {({ bible, book, chapter, bibles }) => (
        <Popover>
          <PopoverTrigger
            as={Button}
            variant="outline"
            role="combobox"
            class="w-[200px] justify-between"
          >
            {bible.abbreviationLocal}
            <ChevronsUpDown class="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </PopoverTrigger>
          <PopoverContent class="w-[200px] p-0">
            <Command>
              <CommandInput placeholder="Search bibles..." />
              <CommandList>
                <CommandEmpty>Not Found</CommandEmpty>
                {uniqueLanguages?.map((language) => (
                  <CommandGroup heading={ISO6391.getName(language)} value={language}>
                    {bibles
                      .filter((bible) => bible.languageISO === language)
                      .map((foundBible) => (
                        <CommandItem
                          value={foundBible.name}
                          onSelect={() => {
                            navigate(
                              `/bible/${foundBible.abbreviation}/${book.abbreviation}/${chapter.number}`
                            );
                          }}
                          class="flex w-full items-center justify-between"
                        >
                          <Check
                            class={`mr-2 h-4 w-4 ${foundBible.id === bible.id ? 'opacity-100' : 'opacity-0'}`}
                          />
                          <div class="flex w-full flex-col justify-end text-end">
                            <p class="text-lg font-medium">{foundBible.abbreviationLocal}</p>
                            <p class="text-xs">{foundBible.nameLocal}</p>
                          </div>
                        </CommandItem>
                      ))}
                  </CommandGroup>
                ))}
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      )}
    </QueryBoundary>
  );
}
