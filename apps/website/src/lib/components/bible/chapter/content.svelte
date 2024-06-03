<script lang="ts">
  import type { RpcClient } from '$lib/types/rpc';
  import type { Content } from '@theaistudybible/core/types/bible';
  import type { InferResponseType } from 'hono/client';
  import { H2 } from '../../ui/typeography';
  import '../contents/contents.css';
  import ReaderContent from '../contents/reader-content.svelte';

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

<H2 class="text-center">{chapter.name}</H2>
<ReaderContent
  {bible}
  {book}
  {chapter}
  {chapterHighlights}
  contents={(chapter as unknown as {content: Content[]}).content}
/>
