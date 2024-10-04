import { db } from '@/core/database';
import type { BibleLanguage } from '@/schemas';
import { QueryBoundary } from '@/www/components/query-boundary';
import { Button } from '@/www/components/ui/button';
import { Input } from '@/www/components/ui/input';
import { H2, P } from '@/www/components/ui/typography';
import { serverFn } from '@/www/server/server-fn';
import { A } from '@solidjs/router';
import { createQuery } from '@tanstack/solid-query';
import { Search } from 'lucide-solid';
import { createMemo, createSignal } from 'solid-js';

const getBibles = serverFn(async () => {
  return await db.query.bibles.findMany({
    with: { biblesToLanguages: { with: { language: true } } },
  });
});

export const largeTranslationPickerQueryOptions = {
  queryKey: ['bibles'],
  queryFn: () => getBibles(),
};

export default function LargeTranslationPicker() {
  const query = createQuery(() => largeTranslationPickerQueryOptions);

  const [search, setSearch] = createSignal('');

  const filteredBibles = createMemo(() => {
    if (!query.isLoading && query.data) {
      return query.data.filter(
        (bible) =>
          bible.name.toLowerCase().includes(search().toLowerCase()) ||
          bible.abbreviation.toLowerCase().includes(search().toLowerCase()),
      );
    }
    return [];
  });

  const uniqueLanguages = createMemo(() =>
    filteredBibles().reduce((acc, bible) => {
      if (!acc.some((language) => language.iso === bible.biblesToLanguages[0].language.iso)) {
        acc.push(bible.biblesToLanguages[0].language);
      }
      return acc;
    }, [] as BibleLanguage[]),
  );

  return (
    <QueryBoundary query={query}>
      {(bibles) => (
        <div class='flex h-full w-full flex-col place-items-center justify-center'>
          <H2>Select your translation:</H2>
          <div class='w-full md:w-3/4 lg:w-1/2'>
            <div class='mt-10 flex w-full place-items-center'>
              <Search class='m-0 rounded-l-lg border border-r-0 p-2' size={40} />
              <Input
                type='search'
                placeholder='Search translations'
                value={search()}
                onChange={(e) => {
                  setSearch(e.target.value);
                }}
                class='rounded-l-none'
              />
            </div>
            <div class='mt-1 flex justify-end'>
              <P class='text-accent-foreground text-xs'>{filteredBibles().length}</P>
            </div>
            <div class='mt-2 flex w-full flex-col space-y-4'>
              {uniqueLanguages().map((language) => (
                <div class='flex w-full flex-col space-y-2'>
                  <div class='font-bold text-lg'>{language.nameLocal}</div>
                  <div class='flex w-full flex-col space-y-2'>
                    {bibles
                      .filter((bible) => bible.biblesToLanguages[0].language.iso === language.iso)
                      .filter(
                        (bible) =>
                          bible.nameLocal.toLowerCase().includes(search().toLowerCase()) ||
                          bible.abbreviationLocal.toLowerCase().includes(search().toLowerCase()),
                      )
                      .map((bible) => (
                        <Button
                          class='flex h-fit w-full flex-col items-start justify-start text-wrap text-start'
                          as={A}
                          href={`/bible/${bible.abbreviation}`}
                        >
                          <p class='font-bold text-lg'>
                            {bible.abbreviationLocal} - {bible.nameLocal}
                          </p>
                          <p class='text-accent-foreground text-xs'>{bible.description}</p>
                        </Button>
                      ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </QueryBoundary>
  );
}
