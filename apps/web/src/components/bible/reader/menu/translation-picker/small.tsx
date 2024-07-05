import { useNavigate } from '@solidjs/router';
import { createQuery } from '@tanstack/solid-query';
import { db } from '@theaistudybible/core/database';
import ISO6391 from 'iso-639-1';
import { Check, ChevronsUpDown } from 'lucide-solid';
import { useBibleReaderStore } from '~/components/providers/bible-reader';
import { QueryBoundary } from '~/components/query-boundary';
import { Button } from '~/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList
} from '~/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '~/components/ui/popover';

async function getSmallPickerData() {
  'use server';
  return await db.query.bibles.findMany();
}

export const smallTranslationPickerQueryOptions = () => ({
  queryKey: ['small-translation-picker'],
  queryFn: () => getSmallPickerData()
});

export default function SmallTranslationPicker() {
  const [brStore] = useBibleReaderStore();
  const query = createQuery(() => smallTranslationPickerQueryOptions());
  const navigate = useNavigate();

  const uniqueLanguages = query.data?.reduce((acc, bible) => {
    if (!acc.some((language) => language === bible.languageISO)) {
      acc.push(bible.languageISO);
    }
    return acc;
  }, [] as string[]);

  return (
    <QueryBoundary query={query}>
      {(bibles) => (
        <Popover>
          <PopoverTrigger
            as={Button}
            variant="outline"
            role="combobox"
            class="justify-between text-nowrap"
          >
            {brStore.bible.abbreviationLocal}
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
                              `/bible/${foundBible.abbreviation}/${brStore.book.abbreviation}/${brStore.chapter.number}`
                            );
                          }}
                          class="flex w-full items-center justify-between"
                        >
                          <Check
                            class={`mr-2 h-4 w-4 ${foundBible.id === brStore.bible.id ? 'opacity-100' : 'opacity-0'}`}
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
