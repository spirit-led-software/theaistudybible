<script lang="ts">
  import { goto } from '$app/navigation';
  import type { RpcClient } from '$lib/types/rpc';
  import type { InferResponseType } from 'hono/client';
  import ISO6391 from 'iso-639-1';
  import { Check, ChevronsUpDown } from 'lucide-svelte';
  import { Button } from '../ui/button';
  import * as Command from '../ui/command';
  import * as Popover from '../ui/popover';

  type Props = {
    bibles: InferResponseType<RpcClient['bibles']['$get']>['data'];
    bible: InferResponseType<RpcClient['bibles'][':id']['$get']>['data'];
    chapter: InferResponseType<
      RpcClient['bibles'][':id']['chapters'][':chapterId']['$get']
    >['data'];
  };

  let { bibles, bible, chapter }: Props = $props();

  let open = $state(false);
  let uniqueLanguages = $derived(
    bibles.reduce((acc, bible) => {
      if (!acc.some((language) => language === bible.languageISO)) {
        acc.push(bible.languageISO);
      }
      return acc;
    }, [] as string[])
  );
</script>

<Popover.Root bind:open>
  <Popover.Trigger asChild let:builder>
    <Button
      builders={[builder]}
      variant="outline"
      role="combobox"
      aria-expanded={open}
      class="w-[200px] justify-between"
    >
      {bible.abbreviationLocal}
      <ChevronsUpDown class="ml-2 h-4 w-4 shrink-0 opacity-50" />
    </Button>
  </Popover.Trigger>
  <Popover.Content class="w-[200px] p-0">
    <Command.Root>
      <Command.Input placeholder="Search bibles..." />
      <Command.List>
        <Command.Empty>Not Found</Command.Empty>
        {#each uniqueLanguages as language}
          <Command.Group heading={ISO6391.getName(language)} value={language}>
            {#each bibles.filter((bible) => bible.languageISO === language) as foundBible}
              <Command.Item
                value={foundBible.name}
                onSelect={async () => {
                  await goto(`/bible/${foundBible.abbreviation}/${chapter.name}`);
                }}
                class="flex w-full items-center justify-between"
              >
                <Check
                  class={`mr-2 h-4 w-4 ${foundBible.id === bible.id ? 'opacity-100' : 'opacity-0'}`}
                />
                <div class="flex flex-col w-full justify-end text-end">
                  <p class="text-lg font-medium">{foundBible.abbreviationLocal}</p>
                  <p class="text-xs">{foundBible.nameLocal}</p>
                </div>
              </Command.Item>
            {/each}
          </Command.Group>
        {/each}
      </Command.List>
    </Command.Root>
  </Popover.Content>
</Popover.Root>
