import { db } from '@/core/database';
import type { Bible, BibleLanguage } from '@/schemas/bibles/types';
import { QueryBoundary } from '@/www/components/query-boundary';
import { Button, type ButtonProps } from '@/www/components/ui/button';
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
import { cn } from '@/www/lib/utils';
import { GET } from '@solidjs/start';
import { createQuery } from '@tanstack/solid-query';
import { Check, ChevronsUpDown } from 'lucide-solid';
import {
  For,
  type ValidComponent,
  createEffect,
  createSignal,
  mergeProps,
  on,
  splitProps,
} from 'solid-js';

const getSmallBiblePickerData = GET(async () => {
  'use server';
  const bibles = await db.query.bibles.findMany({
    where: (bibles, { eq }) => eq(bibles.readyForPublication, true),
    with: { biblesToLanguages: { with: { language: true } } },
  });
  return { bibles };
});

export const smallBiblePickerQueryOptions = () => ({
  queryKey: ['small-bible-picker'],
  queryFn: () => getSmallBiblePickerData(),
  placeholderData: { bibles: [] },
});

export type SmallBiblePickerProps<T extends ValidComponent = 'button'> = Omit<
  ButtonProps<T>,
  'children'
> & {
  value?: string | Bible;
  onValueChange?: (bible?: Bible) => void;
  defaultValue?: string | Bible;
};

export function SmallBiblePicker(props: SmallBiblePickerProps) {
  const mergedProps = mergeProps(props, {
    variant: 'outline',
    role: 'combobox',
  });
  const [local, rest] = splitProps(mergedProps, [
    'value',
    'onValueChange',
    'defaultValue',
    'class',
  ]);

  const query = createQuery(() => smallBiblePickerQueryOptions());

  const [_value, _setValue] = createSignal<Bible | undefined>();
  createEffect(
    on([() => query.status, () => query.data], ([status, data]) => {
      if (status === 'success' && data && local.defaultValue) {
        _setValue(
          data.bibles.find((bible) =>
            typeof local.defaultValue === 'string'
              ? bible.abbreviation === local.defaultValue
              : bible.abbreviation === local.defaultValue?.abbreviation,
          ),
        );
      }
    }),
  );

  const value = () => {
    if (local.value) {
      if (typeof local.value === 'string') {
        if (query.status === 'success') {
          const val = query.data.bibles.find((bible) => bible.abbreviation === local.value);
          _setValue(val);
          return val;
        }
        return undefined;
      }
      return local.value;
    }
    return _value();
  };

  const setValue = (val?: Bible | ((val?: Bible) => Bible | undefined)) => {
    if (local.onValueChange) {
      return local.onValueChange?.(typeof val === 'function' ? val(value()) : val);
    }
    _setValue(val);
  };

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
      {({ bibles }) => {
        const uniqueLanguages = bibles.reduce((acc, bible) => {
          if (!acc.some((language) => language.iso === bible.biblesToLanguages[0].language.iso)) {
            acc.push(bible.biblesToLanguages[0].language);
          }
          return acc;
        }, [] as BibleLanguage[]);

        return (
          <Popover>
            <PopoverTrigger
              as={Button}
              class={cn('flex items-center justify-between text-nowrap', local.class)}
              {...rest}
            >
              <span class='truncate'>{value()?.abbreviationLocal ?? 'Select Bible'}</span>
              <ChevronsUpDown class='ml-2 size-4 shrink-0 opacity-50' />
            </PopoverTrigger>
            <PopoverContent class='w-[200px] p-0'>
              <Command value={value()?.abbreviation}>
                <CommandInput placeholder='Search bibles...' />
                <CommandList>
                  <CommandEmpty>Not Found</CommandEmpty>
                  <For each={uniqueLanguages}>
                    {(language) => (
                      <CommandGroup id={language.iso} heading={language.nameLocal}>
                        {bibles
                          .filter(
                            (bible) => bible.biblesToLanguages[0].language.iso === language.iso,
                          )
                          .map((foundBible) => (
                            <CommandItem
                              value={foundBible.abbreviation}
                              keywords={[
                                foundBible.name,
                                foundBible.nameLocal,
                                foundBible.abbreviation,
                                foundBible.abbreviationLocal,
                              ]}
                              class='flex w-full items-center justify-between'
                              onSelect={() => setValue(foundBible)}
                            >
                              <Check
                                class={cn(
                                  'mr-2 size-4',
                                  foundBible.abbreviation !== value()?.abbreviation && 'hidden',
                                )}
                              />
                              <div class='flex w-full flex-col justify-end text-end'>
                                <p class='font-medium text-lg'>{foundBible.abbreviationLocal}</p>
                                <p class='text-xs'>{foundBible.nameLocal}</p>
                              </div>
                            </CommandItem>
                          ))}
                      </CommandGroup>
                    )}
                  </For>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        );
      }}
    </QueryBoundary>
  );
}
