<script lang="ts">
  import { getDataSources } from '@revelationsai/client/services/data-source';
  import type { DataSource } from '@revelationsai/core/model/data-source';
  import { createInfiniteQuery } from '@tanstack/svelte-query';
  import type { SvelteComponent } from 'svelte';
  import type { PageData } from './$types';
  import CreateDialog from './CreateDialog.svelte';
  import DataSourceRow from './DataSourceRow.svelte';

  export let data: PageData;

  let createDialog: SvelteComponent | undefined = undefined;
  let dataSources: DataSource[] = [];

  const fetchFn = async ({ pageParam = 1 }) => {
    return await getDataSources({ limit: data.limit, page: pageParam }).then((r) => r.dataSources);
  };

  const query = createInfiniteQuery({
    queryKey: ['infinite-data-sources'],
    queryFn: fetchFn,
    initialPageParam: 1,
    getNextPageParam: (lastPage, pages) => {
      if (lastPage.length < data.limit) return undefined;
      return pages.length + 1;
    },
    initialData: {
      pages: [data.dataSources],
      pageParams: [1]
    },
    refetchInterval: 8000
  });
  query.subscribe(({ data, isSuccess }) => {
    if (isSuccess) {
      dataSources = data.pages.flat();
    }
  });
</script>

<svelte:head>
  <title>Data Sources</title>
</svelte:head>

<div class="flex h-full w-full flex-col space-y-5 p-5">
  <div class="flex place-items-center space-x-2">
    <h1 class="text-2xl font-medium">Data Sources</h1>
    <button
      class="btn btn-circle btn-xs bg-slate-700 text-white hover:bg-slate-900"
      on:click={() => createDialog?.show()}>+</button
    >
    <CreateDialog bind:this={createDialog} />
  </div>
  <div class="h-full w-full overflow-auto">
    <table class="table-xs table whitespace-normal">
      <thead>
        <tr>
          <th />
          <th>ID</th>
          <th>Name</th>
          <th>Type</th>
          <th>Sync Schedule</th>
          <th>Last Sync</th>
          <th># of Documents</th>
          <th />
          <th />
        </tr>
      </thead>
      <tbody>
        {#each dataSources as dataSource}
          <DataSourceRow {dataSource} />
        {/each}
        {#if $query.hasNextPage}
          <tr>
            <td colspan="7">
              <button
                class="btn btn-ghost w-full"
                on:click={() => {
                  $query.fetchNextPage();
                }}
              >
                Load More
              </button>
            </td>
          </tr>
        {/if}
      </tbody>
    </table>
  </div>
</div>
