import { db } from '@/core/database';
import type { Bible, BibleLanguage } from '@/schemas/bibles/types';
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
import { cn } from '@/www/lib/utils';
import { useQuery } from '@tanstack/react-query';
import { createServerFn } from '@tanstack/react-start';
import { Check, ChevronsUpDown } from 'lucide-react';
import { useEffect, useState } from 'react';

const getSmallBiblePickerData = createServerFn({ method: 'GET' }).handler(async () => {
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

export type SmallBiblePickerProps = Omit<
  React.ComponentProps<typeof Button>,
  'children' | 'value' | 'onValueChange' | 'defaultValue'
> & {
  value?: string | Bible;
  onValueChange?: (bible?: Bible) => void;
  defaultValue?: string | Bible;
};

export function SmallBiblePicker({
  variant = 'outline',
  role = 'combobox',
  value: propValue,
  onValueChange,
  defaultValue,
  className,
  ...props
}: SmallBiblePickerProps) {
  const query = useQuery(smallBiblePickerQueryOptions());

  const [_value, _setValue] = useState<Bible | undefined>();
  useEffect(() => {
    if (query.status === 'success' && query.data && defaultValue) {
      _setValue(
        query.data.bibles.find((bible) =>
          typeof defaultValue === 'string'
            ? bible.abbreviation === defaultValue
            : bible.abbreviation === defaultValue?.abbreviation,
        ),
      );
    }
  }, [query.status, query.data, defaultValue]);

  const value = () => {
    if (propValue) {
      if (typeof propValue === 'string') {
        if (query.status === 'success') {
          const val = query.data.bibles.find((bible) => bible.abbreviation === propValue);
          _setValue(val);
          return val;
        }
        return undefined;
      }
      return propValue;
    }
    return _value;
  };

  const setValue = (val?: Bible | ((val?: Bible) => Bible | undefined)) => {
    if (onValueChange) {
      return onValueChange?.(typeof val === 'function' ? val(value()) : val);
    }
    _setValue(val);
  };

  return (
    <QueryBoundary
      query={query}
      loadingFallback={
        <Button variant='outline' disabled className='flex items-center gap-2'>
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
            <PopoverTrigger asChild>
              <Button
                variant='outline'
                className={cn('flex items-center justify-between text-nowrap', className)}
                {...props}
              >
                <span className='truncate'>{value()?.abbreviationLocal ?? 'Select Bible'}</span>
                <ChevronsUpDown className='ml-2 size-4 shrink-0 opacity-50' />
              </Button>
            </PopoverTrigger>
            <PopoverContent className='w-[200px] p-0'>
              <Command value={value()?.abbreviation}>
                <CommandInput placeholder='Search bibles...' />
                <CommandList>
                  <CommandEmpty>Not Found</CommandEmpty>
                  {uniqueLanguages.map((language) => (
                    <CommandGroup key={language.iso} id={language.iso} heading={language.nameLocal}>
                      {bibles
                        .filter((bible) => bible.biblesToLanguages[0].language.iso === language.iso)
                        .map((foundBible) => (
                          <CommandItem
                            key={foundBible.abbreviation}
                            value={foundBible.abbreviation}
                            keywords={[
                              foundBible.name,
                              foundBible.nameLocal,
                              foundBible.abbreviation,
                              foundBible.abbreviationLocal,
                            ]}
                            className='flex w-full items-center justify-between'
                            onSelect={() => setValue(foundBible)}
                          >
                            <Check
                              className={cn(
                                'mr-2 size-4',
                                foundBible.abbreviation !== value()?.abbreviation && 'hidden',
                              )}
                            />
                            <div className='flex w-full flex-col justify-end text-end'>
                              <p className='font-medium text-lg'>{foundBible.abbreviationLocal}</p>
                              <p className='text-xs'>{foundBible.nameLocal}</p>
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
      }}
    </QueryBoundary>
  );
}
