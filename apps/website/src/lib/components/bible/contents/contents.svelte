<script lang="ts">
  import { A } from '$lib/components/ui/typeography';
  import type { RpcClient } from '$lib/types/rpc';
  import { cn } from '$lib/utils';
  import type { Content } from '@theaistudybible/core/types/bible';
  import type { InferResponseType } from 'hono/client';
  import CharContent from './char.svelte';
  import NoteContent from './note.svelte';
  import RefContent from './ref.svelte';
  import TextContent from './text.svelte';

  type Props = {
    bible: InferResponseType<RpcClient['bibles'][':id']['$get']>['data'];
    book: InferResponseType<RpcClient['bibles'][':id']['books'][':bookId']['$get']>['data'];
    chapter: InferResponseType<
      RpcClient['bibles'][':id']['chapters'][':chapterId']['$get']
    >['data'];
    contents: Content[];
    highlights?: {
      id: string;
      color: string;
    }[];
    class?: string;
  };

  let { bible, book, chapter, contents, highlights, class: className }: Props = $props();
</script>

{#each contents as content}
  {@const { style, ...attrs } = content.attrs || {}}
  {@const props = Object.entries(attrs).reduce(
    (acc, [key, value]) => {
      if (key.startsWith('data-')) {
        return {
          ...acc,
          [key]: value
        };
      }
      return {
        ...acc,
        [`data-${key}`]: value
      };
    },
    {} as Record<string, string>
  )}
  {#if content.type === 'text'}
    <TextContent {content} {style} {props} {highlights} class={className} />
  {:else if content.type === 'ref'}
    <RefContent {content} {style} {attrs} {props} class={className} {bible} />
  {:else if content.type === 'verse'}
    <A
      id={content.id}
      data-type={content.type}
      {...props}
      class={cn(style, 'hover:underline', className)}
      href={`/bible/${bible.abbreviation}/${book.abbreviation}/${chapter.number}/${content.number}`}
    >
      {content.number}
    </A>
  {:else if content.type === 'char'}
    <CharContent
      {content}
      {style}
      class={className}
      {bible}
      {book}
      {chapter}
      {highlights}
      {props}
    />
  {:else if content.type === 'para'}
    <p id={content.id} data-type={content.type} {...props} class={cn(style, className)}>
      <this {bible} {book} {chapter} contents={content.contents} {highlights}> </this>
    </p>
  {:else if content.type === 'note'}
    <NoteContent {bible} {book} {chapter} {content} {highlights} />
  {:else}
    <p>Unknown content type: {content.type}</p>
  {/if}
{/each}
