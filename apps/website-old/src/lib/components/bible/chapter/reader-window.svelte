<script lang="ts">
  import type { RpcClient } from '$lib/types/rpc';
  import type { InferResponseType } from 'hono/client';
  import { ChevronLeft, ChevronRight } from 'lucide-svelte';
  import { Button } from '../../ui/button';
  import * as Tooltip from '../../ui/tooltip';
  import ChatButton from '../chat/button.svelte';
  import ChapterContent from './content.svelte';

  type Props = {
    bible: InferResponseType<RpcClient['bibles'][':id']['$get']>['data'];
    book: InferResponseType<RpcClient['bibles'][':id']['books'][':bookId']['$get']>['data'];
    chapter: InferResponseType<
      RpcClient['bibles'][':id']['chapters'][':chapterId']['$get']
    >['data'];
    chapterHighlights?: InferResponseType<
      RpcClient['bibles'][':id']['chapters'][':chapterId']['highlights']['$get'],
      200
    >['data'];
  };

  let { bible, book, chapter, chapterHighlights }: Props = $props();
</script>

<div class="mt-10">
  <ChapterContent {bible} {book} {chapter} {chapterHighlights} />
  <div class="fixed bottom-0 left-0 right-0 flex place-items-center justify-center">
    <ChatButton />
  </div>
  <!-- <ChatWindow /> -->
  {#if chapter.previous}
    <div class="fixed bottom-1/3 left-0 top-1/3 flex flex-col place-items-center justify-center">
      <Tooltip.Root>
        <Tooltip.Trigger asChild let:builder>
          <Button
            builders={[builder]}
            class="my-auto h-20 w-10 rounded-r-2xl"
            href={`/bible/${bible.abbreviation}/${chapter.previous.abbreviation.split('.')[0]}/${chapter.previous.number}`}
          >
            <ChevronLeft size={20} class="shrink-0" />
          </Button>
        </Tooltip.Trigger>
        <Tooltip.Content side="right">
          <p>{chapter.previous.name}</p>
        </Tooltip.Content>
      </Tooltip.Root>
    </div>
  {/if}
  {#if chapter.next}
    <div class="fixed bottom-1/3 right-0 top-1/3 flex flex-col place-items-center justify-center">
      <Tooltip.Root>
        <Tooltip.Trigger asChild let:builder>
          <Button
            builders={[builder]}
            class="my-auto h-20 w-10 rounded-l-2xl"
            href={`/bible/${bible.abbreviation}/${chapter.next.abbreviation.split('.')[0]}/${chapter.next.number}`}
          >
            <ChevronRight size={20} class="shrink-0" />
          </Button>
        </Tooltip.Trigger>
        <Tooltip.Content side="left">
          <p>{chapter.next.name}</p>
        </Tooltip.Content>
      </Tooltip.Root>
    </div>
  {/if}
</div>
