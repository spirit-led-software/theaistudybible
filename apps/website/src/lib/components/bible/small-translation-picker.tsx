'use client';

import type { Routes } from '@/types/rpc';
import type { InferResponseType } from 'hono/client';
import ISO6391 from 'iso-639-1';
import { Check, ChevronsUpDown } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Button } from '../ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList
} from '../ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';

export default function SmallTranslationPicker({
  bibles,
  bible,
  chapter
}: {
  bibles: InferResponseType<Routes['bibles']['$get']>['data'];
  bible: InferResponseType<Routes['bibles'][':id']['$get']>['data'];
  chapter: InferResponseType<Routes['bibles'][':id']['chapters'][':chapterId']['$get']>['data'];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const uniqueLanguages = bibles.reduce((acc, bible) => {
    if (!acc.some((language) => language === bible.languageISO)) {
      acc.push(bible.languageISO);
    }
    return acc;
  }, [] as string[]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-[200px] justify-between"
        >
          {bible.abbreviationLocal}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-0">
        <Command>
          <CommandInput placeholder="Search bibles..." />
          <CommandList>
            <CommandEmpty>Not Found</CommandEmpty>
            {uniqueLanguages.map((language, index) => (
              <CommandGroup heading={ISO6391.getName(language)} key={index} value={language}>
                {bibles
                  .filter((bible) => bible.languageISO === language)
                  .map((foundBible) => (
                    <CommandItem
                      key={foundBible.id}
                      value={foundBible.name}
                      onSelect={() => {
                        router.push(`/bible/${foundBible.abbreviation}/${chapter.name}`);
                      }}
                      className="flex w-full items-center justify-between"
                    >
                      <Check
                        className={`mr-2 h-4 w-4 ${foundBible.id === bible.id ? 'opacity-100' : 'opacity-0'}`}
                      />
                      <div className="flex w-full flex-col justify-end text-end">
                        <p className="text-lg font-medium">{foundBible.abbreviationLocal}</p>
                        <p className="text-xs">{foundBible.nameLocal}</p>
                      </div>
                    </CommandItem>
                  ))}
              </CommandGroup>
            ))}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
