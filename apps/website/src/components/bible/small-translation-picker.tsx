import { useNavigate } from '@solidjs/router';
import type { InferResponseType } from 'hono/client';
import ISO6391 from 'iso-639-1';
import { Check, ChevronsUpDown } from 'lucide-solid';
import { createSignal } from 'solid-js';
import type { RpcClient } from '~/types/rpc';
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
  bibles: InferResponseType<RpcClient['bibles']['$get']>['data'];
  bible: InferResponseType<RpcClient['bibles'][':id']['$get']>['data'];
  chapter: InferResponseType<RpcClient['bibles'][':id']['chapters'][':chapterId']['$get']>['data'];
}) {
  const navigate = useNavigate();
  const [open, setOpen] = createSignal(false);

  const uniqueLanguages = bibles.reduce((acc, bible) => {
    if (!acc.some((language) => language === bible.languageISO)) {
      acc.push(bible.languageISO);
    }
    return acc;
  }, [] as string[]);

  return (
    <Popover open={open()} onOpenChange={setOpen}>
      <PopoverTrigger
        as={() => (
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open()}
            class="w-[200px] justify-between"
          >
            {bible.abbreviationLocal}
            <ChevronsUpDown class="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        )}
      />
      <PopoverContent class="w-[200px] p-0">
        <Command>
          <CommandInput placeholder="Search bibles..." />
          <CommandList>
            <CommandEmpty>Not Found</CommandEmpty>
            {uniqueLanguages.map((language) => (
              <CommandGroup heading={ISO6391.getName(language)} value={language}>
                {bibles
                  .filter((bible) => bible.languageISO === language)
                  .map((foundBible) => (
                    <CommandItem
                      value={foundBible.name}
                      onSelect={() => {
                        navigate(`/bible/${foundBible.abbreviation}/${chapter.name}`);
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
  );
}
