<script lang="ts">
  import { Tooltip, TooltipContent, TooltipTrigger } from '$lib/components/ui/tooltip';
  import { A } from '$lib/components/ui/typeography';
  import type { RpcClient } from '$lib/types/rpc';
  import { cn } from '$lib/utils';
  import type { CharContent as CharContentType } from '@theaistudybible/core/types/bible';
  import type { InferResponseType } from 'hono/client';
  import Contents from './contents.svelte';

  type Props = {
    content: CharContentType;
    style: string;
    class?: string;
    bible: InferResponseType<RpcClient['bibles'][':id']['$get']>['data'];
    book: InferResponseType<RpcClient['bibles'][':id']['books'][':bookId']['$get']>['data'];
    chapter: InferResponseType<
      RpcClient['bibles'][':id']['chapters'][':chapterId']['$get']
    >['data'];
    highlights?: {
      id: string;
      color: string;
    }[];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    props: any;
  };

  let {
    content,
    style,
    class: className,
    bible,
    book,
    chapter,
    highlights,
    props
  }: Props = $props();

  let strongsNumber = $derived(content.attrs?.strong);
</script>

{#snippet charContent()}
  <span
    id={content.id}
    data-type={content.type}
    data-verse-id={content.verseId}
    data-verse-number={content.verseNumber}
    {...props}
    class={cn(style, className)}
  >
    <Contents {bible} {book} {chapter} contents={content.contents} {highlights} />
  </span>
{/snippet}

{#if strongsNumber}
  {@const language = strongsNumber.startsWith('H') ? 'hebrew' : 'greek'}
  {@const number = strongsNumber.slice(1)}
  {@const strongsLink = `https://biblehub.com/strongs/${language}/${number}.htm`}
  <Tooltip>
    <TooltipTrigger>
      {@render charContent()}
    </TooltipTrigger>
    <TooltipContent side="bottom" class="flex w-fit justify-center indent-0">
      <div class="w-full text-center">
        <h6 class="font-bold">Strong{"'"}s</h6>
        <A href={strongsLink} class="hover:underline">
          {strongsNumber}
        </A>
      </div>
    </TooltipContent>
  </Tooltip>
{:else}
  {@render charContent()}
{/if}
