<script lang="ts">
  import type { RpcClient } from '$lib/types/rpc';
  import type { InferResponseType } from 'hono/client';
  import { ChevronLeft, ChevronRight } from 'lucide-svelte';
  import { Button } from '../../ui/button';
  import { Tooltip, TooltipContent, TooltipTrigger } from '../../ui/tooltip';
  import ChatButton from '../chat/button.svelte';
  import ChatWindow from '../chat/window.svelte';
  import VerseContent from './content.svelte';

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
    verse: InferResponseType<RpcClient['bibles'][':id']['verses'][':verseId']['$get']>['data'];
  };

  let { bible, book, chapter, chapterHighlights, verse }: Props = $props();
</script>

<div class="mt-10">
  <VerseContent {bible} {book} {chapter} {chapterHighlights} {verse} />
  <div class="fixed bottom-0 left-0 right-0 flex place-items-center justify-center">
    <ChatButton />
  </div>
  <ChatWindow />
  {#if verse.previous}
    <div class="fixed bottom-1/3 left-0 top-1/3 flex flex-col place-items-center justify-center">
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            class="my-auto h-20 w-10 rounded-r-2xl"
            href={`/bible/${bible.abbreviation}/${chapter.previous?.abbreviation.split('.')[0]}` +
              `/${verse.previous?.abbreviation.split('.')[1]}/${verse.previous.number}`}
          >
            <ChevronLeft size={20} class="shrink-0" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="right">
          <p>{verse.previous?.name}</p>
        </TooltipContent>
      </Tooltip>
    </div>
  {/if}
  {#if verse.next}
    <div class="fixed bottom-1/3 right-0 top-1/3 flex flex-col place-items-center justify-center">
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            class="my-auto h-20 w-10 rounded-l-2xl"
            href={`/bible/${bible.abbreviation}/${chapter.next?.abbreviation.split('.')[0]}` +
              `/${verse.next?.abbreviation.split('.')[1]}/${verse.next.number}`}
          >
            <ChevronRight size={20} class="shrink-0" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="left">
          <p>{verse.next?.name}</p>
        </TooltipContent>
      </Tooltip>
    </div>
  {/if}
</div>
