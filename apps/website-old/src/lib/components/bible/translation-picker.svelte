<script lang="ts">
  import type { RpcClient } from '$lib/types/rpc';
  import type { InferResponseType } from 'hono/client';
  import ISO6391 from 'iso-639-1';
  import { Search } from 'lucide-svelte';
  import { Button } from '../ui/button';
  import { Input } from '../ui/input';
  import { H2, P } from '../ui/typeography';

  type Props = {
    bibles: InferResponseType<RpcClient['bibles']['$get']>['data'];
  };

  let { bibles }: Props = $props();

  let search = $state('');

  let filteredBibles = $derived(
    bibles.filter(
      (bible) =>
        bible.name.toLowerCase().includes(search.toLowerCase()) ||
        bible.abbreviation.toLowerCase().includes(search.toLowerCase())
    )
  );

  let uniqueLanguages = $derived(
    filteredBibles.reduce((acc, bible) => {
      if (!acc.some((languageISO) => languageISO === bible.languageISO)) {
        acc.push(bible.languageISO);
      }
      return acc;
    }, [] as string[])
  );
</script>

<div class="flex h-full w-full flex-col place-items-center justify-center">
  <H2>Select your translation:</H2>
  <div class="w-full md:w-3/4 lg:w-1/2">
    <div class="mt-10 flex w-full place-items-center">
      <Search class="m-0 rounded-l-lg border border-r-0 p-2" size={40} />
      <Input
        type="search"
        placeholder="Search translations"
        value={search}
        onchange={(e) => {
          search = e.currentTarget?.value ?? '';
        }}
        class="rounded-l-none"
      />
    </div>
    <div class="mt-1 flex justify-end">
      <P class="text-xs text-accent-foreground">{filteredBibles.length}</P>
    </div>
    <div class="mt-2 flex w-full flex-col space-y-4">
      {#each uniqueLanguages as language}
        <div class="flex w-full flex-col space-y-2">
          <div class="text-lg font-bold">{ISO6391.getName(language)}</div>
          <div class="flex w-full flex-col space-y-2">
            {#each bibles
              .filter((bible) => bible.languageISO === language)
              .filter((bible) => bible.nameLocal
                    .toLowerCase()
                    .includes(search.toLowerCase()) || bible.abbreviationLocal
                    .toLowerCase()
                    .includes(search.toLowerCase())) as bible}
              <Button
                href={`/bible/${bible.abbreviation}`}
                class="flex flex-col h-fit w-full items-start justify-start text-wrap"
              >
                <p class="text-lg font-bold">
                  {bible.abbreviationLocal} - {bible.nameLocal}
                </p>
                <p class="text-xs text-accent-foreground">{bible.description}</p>
              </Button>
            {/each}
          </div>
        </div>
      {/each}
    </div>
  </div>
</div>
