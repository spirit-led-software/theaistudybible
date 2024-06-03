<script lang="ts">
  import { page } from '$app/stores';
  import ChapterReaderWindow from '$lib/components/bible/chapter/reader-window.svelte';
  import { P } from '$lib/components/ui/typeography';
  import { createQuery } from '@tanstack/svelte-query';
  import type { PageData } from './$types';
  import { getBible, getBook, getChapter, getChapterHighlights } from './data';

  type Props = {
    data: PageData;
  };

  let { data }: Props = $props();
  let { bibleAbbr, bookAbbr, chapterNum } = $derived($page.params);

  const bibleQuery = $derived(
    createQuery({
      queryKey: ['bible', bibleAbbr],
      queryFn: async () => await getBible(data.rpcClient, bibleAbbr)
    })
  );

  const bookQuery = $derived(
    createQuery({
      queryKey: ['book', bibleAbbr, bookAbbr],
      queryFn: async () => await getBook(data.rpcClient, bibleAbbr, bookAbbr)
    })
  );

  const chapterQuery = $derived(
    createQuery({
      queryKey: ['chapter', bibleAbbr, bookAbbr, chapterNum],
      queryFn: async () => await getChapter(data.rpcClient, bibleAbbr, bookAbbr, chapterNum)
    })
  );

  const chapterHighlightsQuery = $derived(
    createQuery({
      queryKey: ['chapter-highlights', bibleAbbr, bookAbbr, chapterNum],
      queryFn: async () =>
        await getChapterHighlights(data.rpcClient, bibleAbbr, bookAbbr, chapterNum)
    })
  );

  let isLoading = $derived(
    $bibleQuery.isLoading ||
      $bookQuery.isLoading ||
      $chapterQuery.isLoading ||
      $chapterHighlightsQuery.isLoading
  );

  let isError = $derived(
    $bibleQuery.isError ||
      $bookQuery.isError ||
      $chapterQuery.isError ||
      $chapterHighlightsQuery.isError
  );

  let queryData = $derived.by(() => {
    if (!$bibleQuery.data || !$bookQuery.data || !$chapterQuery.data) {
      return undefined;
    }

    return {
      bible: $bibleQuery.data,
      book: $bookQuery.data,
      chapter: $chapterQuery.data,
      chapterHighlights: $chapterHighlightsQuery.data
    };
  });
</script>

{#if isLoading}
  <div class="flex h-full w-full flex-col place-items-center justify-center">
    <div class="animate-pulse rounded-md bg-muted"></div>
  </div>
{:else if isError}
  <div class="flex h-full w-full flex-col place-items-center justify-center">
    <P>Failed to load chapter</P>
  </div>
{:else if queryData}
  <ChapterReaderWindow
    bible={queryData.bible}
    book={queryData.book}
    chapter={queryData.chapter}
    chapterHighlights={queryData.chapterHighlights || undefined}
  />
{/if}
