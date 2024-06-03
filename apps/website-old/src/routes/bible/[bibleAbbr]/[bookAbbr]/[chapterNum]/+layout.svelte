<script lang="ts">
  import { page } from '$app/stores';
  import BookChapterPicker from '$lib/components/bible/book-chapter-picker.svelte';
  import SmallTranslationPicker from '$lib/components/bible/small-translation-picker.svelte';
  import { P } from '$lib/components/ui/typeography';
  import { createQuery } from '@tanstack/svelte-query';
  import type { Snippet } from 'svelte';
  import { Circle } from 'svelte-loading-spinners';
  import type { LayoutData } from './$types';
  import { getBible, getBibles, getBook, getBooks, getChapter } from './data';

  type Props = {
    data: LayoutData;
    children: Snippet;
  };

  let { data, children }: Props = $props();
  let { bibleAbbr, bookAbbr, chapterNum } = $derived($page.params);

  const biblesQuery = createQuery({
    queryKey: ['bibles'],
    queryFn: async () => await getBibles(data.rpcClient)
  });

  const bibleQuery = $derived(
    createQuery({
      queryKey: ['bible', bibleAbbr],
      queryFn: async () => await getBible(data.rpcClient, bibleAbbr)
    })
  );

  const booksQuery = $derived(
    createQuery({
      queryKey: ['books', bibleAbbr],
      queryFn: async () => await getBooks(data.rpcClient, bibleAbbr)
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

  const isLoading = $derived(
    $biblesQuery.isLoading ||
      $bibleQuery.isLoading ||
      $booksQuery.isLoading ||
      $bookQuery.isLoading ||
      $chapterQuery.isLoading
  );
  const isError = $derived(
    $biblesQuery.isError ||
      $bibleQuery.isError ||
      $booksQuery.isError ||
      $bookQuery.isError ||
      $chapterQuery.isError
  );
  const queryData = $derived.by(() => {
    if (
      !$biblesQuery.data ||
      !$bibleQuery.data ||
      !$booksQuery.data ||
      !$bookQuery.data ||
      !$chapterQuery.data
    ) {
      return undefined;
    }

    return {
      bibles: $biblesQuery.data,
      bible: $bibleQuery.data,
      books: $booksQuery.data,
      book: $bookQuery.data,
      chapter: $chapterQuery.data
    };
  });
</script>

<div
  class="relative flex h-full w-full flex-col justify-center px-16 py-5 md:px-20 lg:px-36 xl:px-48"
>
  {#if isLoading}
    <div class="flex h-full w-full flex-col items-center justify-center">
      <Circle />
    </div>
  {:else if isError}
    <div class="flex h-full w-full flex-col items-center justify-center">
      <P>Error</P>
    </div>
  {:else if queryData}
    <div class="flex h-full w-full flex-col overflow-hidden">
      <div class="flex w-full space-x-2">
        <BookChapterPicker
          bible={queryData.bible}
          books={queryData.books}
          book={queryData.book}
          chapter={queryData.chapter}
        />
        <SmallTranslationPicker
          bibles={queryData.bibles}
          bible={queryData.bible}
          chapter={queryData.chapter}
        />
      </div>
      {@render children()}
    </div>
  {/if}
</div>
