<script lang="ts">
  import { useRpcClient } from '$lib/hooks/rpc';
  import type { RpcClient } from '$lib/types/rpc';
  import { createQuery } from '@tanstack/svelte-query';
  import type { InferResponseType } from 'hono/client';
  import { Check } from 'lucide-svelte';
  import { Circle } from 'svelte-loading-spinners';
  import * as Accordion from '../ui/accordion';
  import { Button } from '../ui/button';
  import * as Command from '../ui/command';

  type Props = {
    bible: InferResponseType<RpcClient['bibles'][':id']['$get']>['data'];
    book: InferResponseType<RpcClient['bibles'][':id']['books'][':bookId']['$get']>['data'];
    chapter: InferResponseType<
      RpcClient['bibles'][':id']['chapters'][':chapterId']['$get']
    >['data'];
  };

  let { bible, book, chapter }: Props = $props();

  let rpcClient = useRpcClient();

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
      return (await response.json()).data;
    },
    enabled: false
  });
</script>

<Command.Item value={book.shortName} class="aria-selected:bg-background">
  <Accordion.Root class="w-full">
    <Accordion.Item value={book.abbreviation} onclick={() => !$query.data && $query.refetch()}>
      <Accordion.Trigger>{book.shortName}</Accordion.Trigger>
      <Accordion.Content class="grid grid-cols-3 gap-1">
        {#if $query.isLoading}
          <div class="col-span-3">
            <Circle size={24} />
          </div>
        {:else if $query.isError}
          <Command.Empty>Error</Command.Empty>
        {:else if $query.data}
          {#each $query.data as foundChapter}
            <Button
              variant="outline"
              href={`/bible/${bible.abbreviation}/${book.abbreviation}/${foundChapter.number}`}
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
      </Accordion.Content>
    </Accordion.Item>
  </Accordion.Root>
</Command.Item>
