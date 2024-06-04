import { A } from '@solidjs/router';
import type { InferResponseType } from 'hono/client';
import ISO6391 from 'iso-639-1';
import { Search } from 'lucide-solid';
import { createMemo, createSignal } from 'solid-js';
import type { RpcClient } from '~/types/rpc';
import { Button } from '../ui/button';
import { H2, P } from '../ui/typography';

export default function TranslationPicker({
  bibles
}: {
  bibles: InferResponseType<RpcClient['bibles']['$get']>['data'];
}) {
  const [search, setSearch] = createSignal('');

  const filteredBibles = createMemo(() =>
    bibles.filter(
      (bible) =>
        bible.name.toLowerCase().includes(search().toLowerCase()) ||
        bible.abbreviation.toLowerCase().includes(search().toLowerCase())
    )
  );

  const uniqueLanguages = createMemo(() =>
    filteredBibles().reduce((acc, bible) => {
      if (!acc.some((languageISO) => languageISO === bible.languageISO)) {
        acc.push(bible.languageISO);
      }
      return acc;
    }, [] as string[])
  );

  return (
    <div class="flex h-full w-full flex-col place-items-center justify-center">
      <H2>Select your translation:</H2>
      <div class="w-full md:w-3/4 lg:w-1/2">
        <div class="mt-10 flex w-full place-items-center">
          <Search class="m-0 rounded-l-lg border border-r-0 p-2" size={40} />
          <input
            type="search"
            placeholder="Search translations"
            value={search()}
            onChange={(e) => {
              setSearch(e.target.value);
            }}
            class="rounded-l-none"
          />
        </div>
        <div class="mt-1 flex justify-end">
          <P class="text-xs text-accent-foreground">{filteredBibles.length}</P>
        </div>
        <div class="mt-2 flex w-full flex-col space-y-4">
          {uniqueLanguages().map((language) => (
            <div class="flex w-full flex-col space-y-2">
              <div class="text-lg font-bold">{ISO6391.getName(language)}</div>
              <div class="flex w-full flex-col space-y-2">
                {bibles
                  .filter((bible) => bible.languageISO === language)
                  .filter(
                    (bible) =>
                      bible.nameLocal.toLowerCase().includes(search().toLowerCase()) ||
                      bible.abbreviationLocal.toLowerCase().includes(search().toLowerCase())
                  )
                  .map((bible) => (
                    <Button
                      class="flex h-fit w-full items-start justify-start text-wrap"
                      as={() => (
                        <A
                          href={`/bible/${bible.abbreviation}`}
                          class="flex flex-col place-items-start justify-start text-start"
                        >
                          <p class="text-lg font-bold">
                            {bible.abbreviationLocal} - {bible.nameLocal}
                          </p>
                          <p class="text-xs text-accent-foreground">{bible.description}</p>
                        </A>
                      )}
                    />
                  ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
