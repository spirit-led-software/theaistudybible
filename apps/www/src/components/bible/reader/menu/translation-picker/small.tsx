import { db } from '@/core/database';
import type { BibleLanguage } from '@/schemas/bibles/types';
import { QueryBoundary } from '@/www/components/query-boundary';
import { Button } from '@/www/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/www/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/www/components/ui/popover';
import { Spinner } from '@/www/components/ui/spinner';
import { useBibleReaderStore } from '@/www/contexts/bible-reader';
import { useNavigate } from '@solidjs/router';
import { GET } from '@solidjs/start';
import { createQuery } from '@tanstack/solid-query';
import { Check, ChevronsUpDown } from 'lucide-solid';
import { createMemo } from 'solid-js';

const getSmallPickerData = GET(async () => {
  'use server';
  const bibles = await db.query.bibles.findMany({
    where: (bibles, { eq }) => eq(bibles.readyForPublication, true),
    with: { biblesToLanguages: { with: { language: true } } },
  });
  return { bibles };
});

export const smallTranslationPickerQueryOptions = () => ({
  queryKey: ['small-translation-picker'],
  queryFn: () => getSmallPickerData(),
});

export function SmallTranslationPicker() {
  const navigate = useNavigate();
  const [brStore] = useBibleReaderStore();

  const query = createQuery(() => smallTranslationPickerQueryOptions());

  const uniqueLanguages = createMemo(() => {
    if (query.status === 'success') {
      return (
        query.data.bibles.reduce((acc, bible) => {
          if (!acc.some((language) => language.iso === bible.biblesToLanguages[0].language.iso)) {
            acc.push(bible.biblesToLanguages[0].language);
          }
          return acc;
        }, [] as BibleLanguage[]) ?? []
      );
    }
    return [];
  });

  return (
    <QueryBoundary
      query={query}
      loadingFallback={
        <Button variant='outline' disabled class='flex items-center gap-2'>
          <span>Loading</span>
          <Spinner size='sm' />
        </Button>
      }
    >
      {({ bibles }) => (
        <Popover>
          <PopoverTrigger
            as={Button}
            variant='outline'
            // biome-ignore lint/a11y/useSemanticElements: Our select doesn't work like this
            role='combobox'
            class='flex items-center justify-between text-nowrap'
          >
            {brStore.bible.abbreviationLocal}
            <ChevronsUpDown class='ml-2 h-4 w-4 shrink-0 opacity-50' />
          </PopoverTrigger>
          <PopoverContent class='w-[200px] p-0'>
            <Command>
              <CommandInput placeholder='Search bibles...' />
              <CommandList>
                <CommandEmpty>Not Found</CommandEmpty>
                {uniqueLanguages().map((language) => (
                  <CommandGroup heading={language.nameLocal} value={language.name}>
                    {bibles
                      .filter((bible) => bible.biblesToLanguages[0].language.iso === language.iso)
                      .map((foundBible) => (
                        <CommandItem
                          value={foundBible.name}
                          onSelect={() => {
                            navigate(
                              `/bible/${foundBible.abbreviation}/${brStore.book.code}/${brStore.chapter.number}`,
                            );
                          }}
                          class='flex w-full items-center justify-between'
                        >
                          <Check
                            class={`mr-2 h-4 w-4 ${foundBible.id === brStore.bible.id ? 'opacity-100' : 'opacity-0'}`}
                          />
                          <div class='flex w-full flex-col justify-end text-end'>
                            <p class='font-medium text-lg'>{foundBible.abbreviationLocal}</p>
                            <p class='text-xs'>{foundBible.nameLocal}</p>
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
