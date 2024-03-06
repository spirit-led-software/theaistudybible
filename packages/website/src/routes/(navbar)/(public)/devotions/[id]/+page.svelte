<script lang="ts">
  // @ts-expect-error These packages don't have types
  import { Email, Facebook, X } from 'svelte-share-buttons-component';

  import { page } from '$app/stores';
  import { PUBLIC_API_URL } from '$env/static/public';
  import { session } from '$lib/stores/user';
  import { default as Icon, default as Iconify } from '@iconify/svelte';
  import type { devotionReactions } from '@revelationsai/core/database/schema';
  import type { NeonVectorStoreDocument } from '@revelationsai/core/langchain/vectorstores/neon';
  import { toTitleCase } from '@revelationsai/core/util/string';
  import Day from 'dayjs';
  import type { PageData } from './$types';

  export let data: PageData;

  let isLoading = false;
  let alert: string | undefined = undefined;
  let shareModal: HTMLDialogElement | undefined = undefined;

  $: handleReaction = async (reaction: (typeof devotionReactions.reaction.enumValues)[number]) => {
    isLoading = true;
    try {
      if (reaction === 'LIKE') {
        likeCount++;
      } else if (reaction === 'DISLIKE') {
        dislikeCount++;
      }

      const response = await fetch(`${PUBLIC_API_URL}/devotions/${activeDevo.id}/reactions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${$session}`
        },
        body: JSON.stringify({
          reaction: reaction
        })
      });
      if (!response.ok) {
        // Revert reaction count
        if (reaction === 'LIKE') {
          likeCount--;
        } else if (reaction === 'DISLIKE') {
          dislikeCount--;
        }

        const { error } = await response.json();
        throw new Error(error ?? 'An unknown error occurred.');
      }
    } catch (error) {
      console.error(error);
      alert = error instanceof Error ? error.message : JSON.stringify(error);
    }
    isLoading = false;
  };

  $: ({ devotion: activeDevo, sourceDocs, images, reactionCounts } = data);
  $: likeCount = reactionCounts?.LIKE || 0;
  $: dislikeCount = reactionCounts?.DISLIKE || 0;
  $: sourceDocuments = sourceDocs?.filter((sourceDoc: NeonVectorStoreDocument, index: number) => {
    const firstIndex = sourceDocs.findIndex(
      (otherSourceDoc: NeonVectorStoreDocument) =>
        sourceDoc.metadata.url === otherSourceDoc.metadata.url
    );
    return firstIndex === index;
  });

  $: if (alert) setTimeout(() => (alert = undefined), 8000);

  $: cleanDate = Day(activeDevo.createdAt).format('MMMM D, YYYY');
</script>

<svelte:head>
  <title>
    {cleanDate}: {activeDevo.bibleReading.substring(0, activeDevo.bibleReading.indexOf(' -'))}
  </title>
  <meta
    name="description"
    content={`AI-Generated Daily Devotions by RevelationsAI. Devotion for ${cleanDate}. Topic: ${activeDevo.topic}. Bible Reading: ${activeDevo.bibleReading}`}
  />
</svelte:head>

<div class="absolute flex h-full w-full flex-col overflow-y-scroll lg:static">
  <div class="relative flex w-full flex-col space-y-5 px-5 pb-20 pt-5">
    <div class="fixed bottom-3 right-3 z-20 flex justify-between space-x-1">
      <button
        disabled={isLoading}
        on:click|preventDefault={() => handleReaction('LIKE')}
        class="group flex place-items-center justify-center rounded-full bg-slate-300 bg-opacity-90 px-3 py-2 text-center text-white hover:bg-slate-400"
      >
        <span class="mr-2">{likeCount}</span>
        <Iconify icon="fa6-regular:thumbs-up" class="group-hover:text-green-400" />
      </button>
      <button
        disabled={isLoading}
        on:click|preventDefault={() => handleReaction('DISLIKE')}
        class="group flex place-items-center justify-center rounded-full bg-slate-300 bg-opacity-90 px-3 py-2 text-center text-white hover:bg-slate-400"
      >
        <span class="mr-2">{dislikeCount}</span>
        <Iconify icon="fa6-regular:thumbs-down" class="group-hover:text-red-400" />
      </button>
      <dialog bind:this={shareModal} class="modal">
        <form method="dialog" class="modal-box flex w-fit flex-col space-y-2">
          <h1 class="text-bold">Share to:</h1>
          <div class="flex place-items-center justify-center space-x-2">
            <Email
              class="flex h-12 w-12 place-items-center justify-center overflow-hidden rounded-full"
              subject="New Devotion from RevelationsAI"
              body={`Checkout the latest Devotion from RevelationsAI:\n\n${$page.url.toString()}`}
            />
            <Facebook
              class="flex h-12 w-12 place-items-center justify-center overflow-hidden rounded-full"
              url={$page.url.toString()}
              quote="Checkout the latest devotion from RevelationsAI"
            />
            <X
              class="flex h-12 w-12 place-items-center justify-center overflow-hidden rounded-full"
              text="Checkout the latest devotion from RevelationsAI:"
              url={$page.url.toString()}
              hashtags="revelationsai,ai,christ,jesus"
            />
          </div>
        </form>
        <form method="dialog" class="modal-backdrop">
          <button>close</button>
        </form>
      </dialog>
      <button
        on:click={() => shareModal?.showModal()}
        class="group flex place-items-center justify-center rounded-full bg-slate-300 bg-opacity-90 px-3 py-2 text-center text-white hover:bg-slate-400"
      >
        <Icon icon="lucide:share" width={20} height={20} />
      </button>
    </div>
    <div
      role="alert"
      class={`absolute left-0 right-0 flex justify-center duration-300 ${
        alert ? 'top-1 scale-100' : '-top-20 scale-0'
      }`}
    >
      <div class="w-2/3 overflow-hidden truncate rounded-lg bg-red-400 py-2 text-center text-white">
        {alert}
      </div>
    </div>
    <h1 class="mb-2 text-center text-2xl font-medium lg:text-left">
      {cleanDate}
      <br />
      <span class="text-center text-base font-normal lg:text-left">
        {toTitleCase(activeDevo.topic)}
      </span>
    </h1>
    {#if !activeDevo.prayer || !activeDevo.reflection || images.length === 0}
      <div
        class="flex w-full flex-col place-items-center justify-center lg:place-items-start lg:justify-start"
      >
        <div
          class="mx-auto flex w-3/4 place-items-center justify-center rounded-xl bg-red-300 px-3 py-2 text-white lg:mx-0 lg:w-fit"
        >
          <span class="mr-3">
            <Iconify icon="material-symbols:warning-outline" class="text-xl" />
          </span>
          This devotion uses an old format. Some of the content may be missing or incorrect. We apologize
          for this inconvenience.
        </div>
      </div>
    {/if}
    {#if activeDevo.bibleReading}
      <div class="mb-3 flex w-full flex-col whitespace-pre-wrap break-words">
        <h2 class="mb-2 text-center text-xl font-medium lg:text-left">Reading</h2>
        <div class="flex w-full flex-col">
          {activeDevo.bibleReading}
        </div>
      </div>
    {/if}
    {#if activeDevo.summary}
      <div class="mb-3 flex w-full flex-col whitespace-pre-wrap break-words">
        <h2 class="mb-2 text-center text-xl font-medium lg:text-left">Summary</h2>
        <div class="flex w-full flex-col">{activeDevo.summary}</div>
      </div>
    {/if}
    {#if activeDevo.reflection}
      <div class="mb-3 flex w-full flex-col whitespace-pre-wrap break-words">
        <h2 class="mb-2 text-center text-xl font-medium lg:text-left">Reflection</h2>
        <div class="flex w-full flex-col">
          {activeDevo.reflection}
        </div>
      </div>
    {/if}
    {#if activeDevo.prayer}
      <div class="mb-3 flex w-full flex-col whitespace-pre-wrap break-words">
        <h2 class="mb-2 text-center text-xl font-medium lg:text-left">Prayer</h2>
        <div class="flex w-full flex-col">{activeDevo.prayer}</div>
      </div>
    {/if}
    {#if images && images.length > 0}
      <div class="flex w-full flex-col">
        <h2 class="mb-2 text-center text-xl font-medium lg:text-left">Generated Image(s)</h2>
        {#if images[0].caption}
          <p class="mb-2 text-center text-sm lg:text-left">{images[0].caption}</p>
        {/if}
        <div class="flex w-full flex-col text-center lg:flex-row lg:space-x-5">
          {#each images as image (image.id)}
            <div class="flex w-full flex-col">
              <img
                src={image.url}
                alt={image.caption}
                width={512}
                height={512}
                class="mx-auto mb-2 rounded-lg shadow-md lg:float-right lg:ml-2"
              />
              <p class="text-center text-xs lg:text-left">
                This image was generated by AI from the devotion text.
              </p>
            </div>
          {/each}
        </div>
      </div>
    {/if}
    {#if activeDevo.diveDeeperQueries && activeDevo.diveDeeperQueries.length > 0}
      <div class="mt-5 flex w-full flex-col">
        <h2 class="mb-2 text-xl font-medium">Dive Deeper</h2>
        <ul class="flex list-inside list-decimal flex-col space-y-2 text-sm">
          {#each activeDevo.diveDeeperQueries as query}
            <li class="flex place-items-center">
              <a
                href={`/chat?query=${encodeURIComponent(query)}`}
                rel="noopener noreferrer"
                class="flex hover:text-slate-500 hover:underline"
              >
                <Icon icon="mdi:chat" class="mr-1 text-slate-500" />
                {query}
              </a>
            </li>
          {/each}
        </ul>
      </div>
    {/if}
    {#if sourceDocuments && sourceDocuments.length > 0}
      <div class="mt-5 flex w-full flex-col">
        <h2 class="mb-2 font-medium">Sources</h2>
        <ul class="flex list-inside list-decimal flex-col space-y-2 text-xs text-slate-400">
          {#each sourceDocuments as sourceDoc (sourceDoc.id)}
            <li>
              <a
                href={sourceDoc.metadata.url}
                target="_blank"
                rel="noopener noreferrer"
                class="hover:text-slate-500 hover:underline"
              >
                <span>{sourceDoc.metadata.title ?? sourceDoc.metadata.name}</span>
                {#if sourceDoc.metadata.author}
                  <span class="ml-1 text-slate-500">by {sourceDoc.metadata.author}</span>
                {/if}
              </a>
            </li>
          {/each}
        </ul>
      </div>
    {/if}
  </div>
</div>
