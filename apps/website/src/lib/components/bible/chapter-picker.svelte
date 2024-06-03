<script lang="ts">
  import { goto } from '$app/navigation';
  import { useRpcClient } from '$lib/runes/rpc.svelte';
  import type { RpcClient } from '$lib/types/rpc';
  import { createQuery } from '@tanstack/svelte-query';
  import type { InferResponseType } from 'hono/client';
  import { Check } from 'lucide-svelte';
  import { Circle } from 'svelte-loading-spinners';
  import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../ui/accordion';
  import { Button } from '../ui/button';
  import { CommandEmpty, CommandItem } from '../ui/command';

  type Props = {
    bible: InferResponseType<RpcClient['bibles'][':id']['$get']>['data'];
    book: InferResponseType<RpcClient['bibles'][':id']['books'][':bookId']['$get']>['data'];
    chapter: InferResponseType<
      RpcClient['bibles'][':id']['chapters'][':chapterId']['$get']
    >['data'];
  };

  let { bible, book, chapter }: Props = $props();

  let open = $state(false);

  let { rpcClient } = useRpcClient();

  const query = createQuery({
    queryKey: ['chapters', { bookId: book.id }],
    queryFn: async () => {
      const response = await rpcClient.bibles[':id'].books[':bookId'].chapters.$get({
        param: {
          id: bible.abbreviation,
          bookId: book.abbreviation
        },
        query: {
          limit: '150',
          sort: 'number:asc'
        }
      });
      if (!response.ok) {
        throw new Error('Failed to fetch chapters');
      }
      return await response.json();
    },
    enabled: false
  });
</script>

<CommandItem value={book.shortName} class="aria-selected:bg-background">
  <Accordion class="w-full">
    <AccordionItem value={book.abbreviation} onclick={() => !$query.data && $query.refetch()}>
      <AccordionTrigger>{book.shortName}</AccordionTrigger>
      <AccordionContent class="grid grid-cols-3 gap-1">
        {#if $query.isLoading}
          <div class="col-span-3">
            <Circle size={24} />
          </div>
        {:else if $query.isError}
          <CommandEmpty>Error</CommandEmpty>
        {:else if $query.data}
          {#each $query.data.data as foundChapter}
            <Button
              variant="outline"
              onclick={async () => {
                await goto(
                  `/bible/${bible.abbreviation}/${book.abbreviation}/${foundChapter.number}`
                );
              }}
              class="flex place-items-center justify-center overflow-visible"
            >
              <Check
                size={10}
                class={`mr-1 h-4 w-4 flex-shrink-0 ${foundChapter.id === chapter.id ? '' : 'hidden'}`}
              />
              {foundChapter.number}
            </Button>
          {/each}
        {/if}
      </AccordionContent>
    </AccordionItem>
  </Accordion>
</CommandItem>
