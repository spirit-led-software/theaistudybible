<script lang="ts">
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import Icon from '@iconify/svelte';
  import { searchForDevotions } from '@revelationsai/client/services/devotion';
  import type { Query } from '@revelationsai/core/database/helpers';
  import type { Devotion } from '@revelationsai/core/model/devotion';
  import { toTitleCase } from '@revelationsai/core/util/string';
  import { createInfiniteQuery } from '@tanstack/svelte-query';
  import Day from 'dayjs';
  import { derived, writable } from 'svelte/store';

  export let initDevos: Devotion[] = [];
  export let activeDevoId: string;

  let isOpen = false;
  let devotions = initDevos;
  let loadingDevoId: string | undefined = undefined;

  const queryString = writable('');

  const fetchDevotions = async ({
    pageParam = 1,
    query = {}
  }: {
    pageParam: number;
    query: Query;
  }) => {
    return await searchForDevotions({
      limit: 7,
      page: pageParam,
      query
    }).then((r) => r.devotions);
  };

  let query = createInfiniteQuery(
    derived(queryString, ($queryString) => {
      let searchQuery: Query = {};
      if ($queryString) {
        searchQuery = {
          OR: [
            {
              iLike: {
                column: 'topic',
                placeholder: `%${$queryString}%`
              }
            },
            {
              iLike: {
                column: 'bibleReading',
                placeholder: `%${$queryString}%`
              }
            }
          ]
        };
      }
      return {
        queryKey: ['infinite-devotions', $queryString],
        queryFn: ({ pageParam }: { pageParam: number }) =>
          fetchDevotions({ pageParam, query: searchQuery }),
        getNextPageParam: (lastPage: Devotion[], pages: Devotion[][]) => {
          if (lastPage.length < 7) return undefined;
          return pages.length + 1;
        },
        initialPageParam: 1,
        initialData: {
          pages: [devotions],
          pageParams: [1]
        }
      };
    })
  );

  query.subscribe(({ data, isSuccess }) => {
    if (isSuccess) {
      devotions = data.pages.flat();
    }
  });

  $: if ($page.url.pathname) {
    isOpen = false;
    loadingDevoId = undefined;
  }

  $: if (loadingDevoId) activeDevoId = loadingDevoId;
</script>

<nav
  class={`absolute z-30 flex h-full flex-shrink-0 flex-grow-0 border-t-2 bg-slate-700 duration-300 lg:static lg:w-1/4 ${
    isOpen ? 'w-full' : 'w-0'
  }`}
>
  <div class="relative flex h-full w-full flex-col">
    <button
      class={`absolute top-2 z-50 cursor-pointer rounded-full border border-slate-700 bg-white p-1 duration-300 lg:hidden ${
        isOpen ? 'right-2 rotate-0' : '-right-10 rotate-180 opacity-75'
      }`}
      on:click|preventDefault={() => (isOpen = !isOpen)}
    >
      <Icon icon="formkit:arrowleft" height={20} width={20} />
    </button>
    <div
      class={`h-full w-full overflow-y-auto px-6 py-4 text-white lg:visible lg:px-2 ${
        isOpen ? 'visible' : 'invisible'
      }`}
    >
      <h1 class="mb-3 px-2 text-2xl font-medium">All Devotions</h1>
      <div class="flex w-full flex-col content-center space-y-2">
        {#if $query.isLoading}
          <div class="flex w-full justify-center">
            <div class="flex items-center justify-center py-5">
              <span class="loading loading-spinner loading-lg" />
            </div>
          </div>
        {:else}
          <div
            class="flex w-full place-items-center justify-center rounded-lg bg-slate-800 px-2 py-1"
          >
            <Icon icon="mdi:magnify" height={20} width={20} />
            <input
              id="search"
              name="search"
              class="flex-1 rounded-lg bg-transparent px-2 py-1 focus:border-none focus:outline-none focus:ring-0"
              placeholder="Search devotions"
              autocomplete="off"
              bind:value={$queryString}
            />
            {#if $queryString}
              <button
                class="hover:text-red-500"
                on:click|preventDefault={() => ($queryString = '')}
              >
                <Icon icon="pajamas:clear" height={15} width={15} />
              </button>
            {/if}
          </div>
        {/if}
        {#each devotions as devotion (devotion.id)}
          <div
            class={`flex w-full cursor-pointer place-items-center justify-between truncate rounded-md px-3 py-1 duration-200 hover:bg-slate-900 active:bg-slate-900 ${
              devotion.id === activeDevoId && 'bg-slate-800'
            }`}
          >
            <button
              class="flex w-full flex-col truncate text-lg"
              on:click|preventDefault={async () => {
                if (activeDevoId === devotion.id) {
                  isOpen = false;
                  return;
                } else {
                  loadingDevoId = devotion.id;
                  await goto(`/devotions/${devotion.id}`);
                }
              }}
            >
              <div>
                {Day(devotion.createdAt).format('MMMM D, YYYY')}
              </div>
              <div class="text-xs">
                {toTitleCase(devotion.topic)} - {devotion.bibleReading.split(' - ')[0]}
              </div>
            </button>
            <div class="flex place-items-center justify-center">
              {#if loadingDevoId === devotion.id}
                <div class="flex place-items-center justify-center">
                  <span class="loading loading-spinner loading-xs" />
                </div>
              {/if}
            </div>
          </div>
        {/each}
        {#if $query.hasNextPage && !$query.isFetchingNextPage}
          <button
            class="flex justify-center rounded-lg border border-white py-2 text-center hover:bg-slate-900"
            on:click|preventDefault={() => $query.fetchNextPage()}
          >
            View more
          </button>
        {:else if $query.isFetchingNextPage}
          <div class="flex w-full justify-center">
            <div class="flex items-center justify-center py-5">
              <span class="loading loading-spinner loading-md" />
            </div>
          </div>
        {/if}
      </div>
    </div>
  </div>
</nav>
