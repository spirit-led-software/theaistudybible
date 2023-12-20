<script lang="ts">
	import { getDataSources } from '$lib/services/data-source';
	import { session } from '$lib/stores/user';
	import type { DataSource } from '@core/model/data-source';
	import { createInfiniteQuery } from '@tanstack/svelte-query';
	import type { SvelteComponent } from 'svelte';
	import type { PageData } from './$types';
	import CreateDialog from './CreateDialog.svelte';
	import DataSourceRow from './DataSourceRow.svelte';

	export let data: PageData;

	let createDialog: SvelteComponent | undefined = undefined;
	let dataSources: DataSource[] = [];

	const fetchFn = async ({ pageParam = 1 }) => {
		return await getDataSources({ limit: data.limit, page: pageParam, session: $session! }).then(
			(r) => r.dataSources
		);
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

<div class="flex flex-col w-full h-full p-5 space-y-5">
	<div class="flex space-x-2 place-items-center">
		<h1 class="text-2xl font-medium">Data Sources</h1>
		<button
			class="text-white btn btn-circle btn-xs bg-slate-700 hover:bg-slate-900"
			on:click={() => createDialog?.show()}>+</button
		>
		<CreateDialog bind:this={createDialog} />
	</div>
	<div class="w-full h-full overflow-auto">
		<table class="table whitespace-normal table-xs">
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
								class="w-full btn btn-ghost"
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
