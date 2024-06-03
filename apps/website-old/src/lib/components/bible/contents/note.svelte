<script lang="ts">
  import { Button } from '$lib/components/ui/button';
  import { Popover, PopoverContent, PopoverTrigger } from '$lib/components/ui/popover';
  import type { RpcClient } from '$lib/types/rpc';
  import type { NoteContent as NoteContentType } from '@theaistudybible/core/types/bible';
  import type { InferResponseType } from 'hono/client';
  import { NotepadTextIcon } from 'lucide-svelte';
  import Contents from './contents.svelte';

  type Props = {
    bible: InferResponseType<RpcClient['bibles'][':id']['$get']>['data'];
    book: InferResponseType<RpcClient['bibles'][':id']['books'][':bookId']['$get']>['data'];
    chapter: InferResponseType<
      RpcClient['bibles'][':id']['chapters'][':chapterId']['$get']
    >['data'];
    content: NoteContentType;
    highlights?: {
      id: string;
      color: string;
    }[];
  };

  let { content, highlights, book, chapter, bible }: Props = $props();
</script>

<Popover>
  <PopoverTrigger asChild class="mx-1">
    <Button variant="ghost" size="sm" class="px-2 py-0">
      <NotepadTextIcon size={12} />
    </Button>
  </PopoverTrigger>
  <PopoverContent side="top" class="eb-container w-52 p-2">
    <Contents {bible} {book} {chapter} contents={content.contents} {highlights} class="text-sm" />
  </PopoverContent>
</Popover>
