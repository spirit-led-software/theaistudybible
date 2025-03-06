import { db } from '@/core/database';
import type { BibleLanguage } from '@/schemas/bibles/types';
import { QueryBoundary } from '@/www/components/query-boundary';
import { Button } from '@/www/components/ui/button';
import { Input } from '@/www/components/ui/input';
import { H2, P } from '@/www/components/ui/typography';
import { useQuery } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import { createServerFn } from '@tanstack/react-start';
import { Search } from 'lucide-react';
import { useState } from 'react';

const getBibles = createServerFn({ method: 'GET' }).handler(async () => {
  const bibles = await db.query.bibles.findMany({
    where: (bibles, { eq }) => eq(bibles.readyForPublication, true),
    with: { biblesToLanguages: { with: { language: true } } },
  });
  return { bibles };
});

export const largeTranslationPickerQueryOptions = {
  queryKey: ['bibles'],
  queryFn: () => getBibles(),
};

export function LargeTranslationPicker() {
  const query = useQuery(largeTranslationPickerQueryOptions);

  const [search, setSearch] = useState('');

  return (
    <QueryBoundary
      query={query}
      render={({ bibles }) => {
        const filteredBibles = bibles.filter(
          (bible) =>
            bible.name.toLowerCase().includes(search.toLowerCase()) ||
            bible.abbreviation.toLowerCase().includes(search.toLowerCase()),
        );
        const uniqueLanguages = filteredBibles.reduce((acc, bible) => {
          if (!acc.some((language) => language.iso === bible.biblesToLanguages[0].language.iso)) {
            acc.push(bible.biblesToLanguages[0].language);
          }
          return acc;
        }, [] as BibleLanguage[]);

        return (
          <div className='flex h-full w-full flex-col place-items-center justify-center'>
            <H2>Select your translation:</H2>
            <div className='w-full md:w-3/4 lg:w-1/2'>
              <div className='mt-10 flex w-full place-items-center'>
                <Search className='m-0 rounded-l-lg border border-r-0 p-2' size={40} />
                <Input
                  type='search'
                  placeholder='Search translations'
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                  }}
                  className='rounded-l-none'
                />
              </div>
              <div className='mt-1 flex justify-end'>
                <P className='text-accent-foreground text-xs'>{filteredBibles.length}</P>
              </div>
              <div className='mt-2 flex w-full flex-col space-y-4'>
                {uniqueLanguages.map((language) => (
                  <div key={language.iso} className='flex w-full flex-col space-y-2'>
                    <div className='font-bold text-lg'>{language.nameLocal}</div>
                    <div className='flex w-full flex-col space-y-2'>
                      {bibles
                        .filter((bible) => bible.biblesToLanguages[0].language.iso === language.iso)
                        .map((bible) => (
                          <Button
                            key={bible.abbreviation}
                            className='flex h-fit w-full flex-col items-start justify-start overflow-hidden text-start'
                            asChild
                          >
                            <Link to={`/bible/${bible.abbreviation}`}>
                              <div className='line-clamp-2 text-wrap font-bold text-lg'>
                                {bible.abbreviationLocal}
                              </div>
                              <div className='line-clamp-2 text-wrap'>{bible.nameLocal}</div>
                              <div className='line-clamp-2 text-wrap text-accent-foreground text-xs'>
                                {bible.description}
                              </div>
                            </Link>
                          </Button>
                        ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      }}
    />
  );
}
