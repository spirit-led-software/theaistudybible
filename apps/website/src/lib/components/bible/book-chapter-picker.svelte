<script lang="ts">
  import type { RpcClient } from '$lib/types/rpc';
  import type { InferResponseType } from 'hono/client';
  import { ChevronsUpDown } from 'lucide-svelte';
  import { Button } from '../ui/button';
  import { Command, CommandEmpty, CommandInput, CommandList } from '../ui/command';
  import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
  import ChapterPicker from './chapter-picker.svelte';

  type Props = {
    bible: InferResponseType<RpcClient['bibles'][':id']['$get']>['data'];
    books: InferResponseType<RpcClient['bibles'][':id']['books']['$get']>['data'];
    book: InferResponseType<RpcClient['bibles'][':id']['books'][':bookId']['$get']>['data'];
    chapter: InferResponseType<
      RpcClient['bibles'][':id']['chapters'][':chapterId']['$get']
    >['data'];
  };

  let { bible, books, book, chapter }: Props = $props();

  let open = $state(false);
</script>

<Popover {open} onOpenChange={() => (open = !open)}>
  <PopoverTrigger asChild>
    <Button
      variant="outline"
      role="combobox"
      aria-expanded={open}
      class="w-[200px] justify-between"
    >
      {book.shortName}
      {chapter.number}
      <ChevronsUpDown class="ml-2 h-4 w-4 shrink-0 opacity-50" />
    </Button>
  </PopoverTrigger>
  <PopoverContent class="w-[200px] p-0">
    <Command>
      <CommandInput placeholder="Search books..." />
      <CommandList>
        <CommandEmpty>Not Found</CommandEmpty>
        {#each books as foundBook}
          <ChapterPicker {bible} book={foundBook} {chapter} />
        {/each}
      </CommandList>
    </Command>
  </PopoverContent>
</Popover>
