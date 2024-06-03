<script lang="ts">
  import type { RpcClient } from '$lib/types/rpc';
  import type { InferResponseType } from 'hono/client';
  import { ChevronsUpDown } from 'lucide-svelte';
  import { Button } from '../ui/button';
  import * as Command from '../ui/command';
  import * as Popover from '../ui/popover';
  import ChapterPicker from './chapter-picker.svelte';

  type Props = {
    bible: InferResponseType<RpcClient['bibles'][':id']['$get']>['data'];
    books: InferResponseType<RpcClient['bibles'][':id']['books']['$get']>['data'];
    book: InferResponseType<RpcClient['bibles'][':id']['books'][':bookId']['$get']>['data'];
    chapter: InferResponseType<
      RpcClient['bibles'][':id']['chapters'][':chapterId']['$get']
    >['data'];
  };

  let open = $state(false);
  let { bible, books, book, chapter }: Props = $props();
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
      {book.shortName}
      {chapter.number}
      <ChevronsUpDown class="ml-2 h-4 w-4 shrink-0 opacity-50" />
    </Button>
  </Popover.Trigger>
  <Popover.Content class="w-[200px] p-0">
    <Command.Root>
      <Command.Input placeholder="Search books..." />
      <Command.List>
        <Command.Empty>Not Found</Command.Empty>
        {#each books as foundBook}
          <ChapterPicker {bible} book={foundBook} {chapter} />
        {/each}
      </Command.List>
    </Command.Root>
  </Popover.Content>
</Popover.Root>
