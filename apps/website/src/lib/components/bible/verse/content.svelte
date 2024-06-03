<script lang="ts">
  import type { RpcClient } from '$lib/types/rpc';
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
    verse: InferResponseType<RpcClient['bibles'][':id']['verses'][':verseId']['$get']>['data'];
  };

  let { bible, book, chapter, chapterHighlights, verse }: Props = $props();
</script>

<H2 class="text-center">{verse.name}</H2>
<ReaderContent {bible} {book} {chapter} {chapterHighlights} contents={verse.content} />
