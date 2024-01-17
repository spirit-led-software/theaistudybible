<script lang="ts">
	import {
		getIndexOperations,
		updateIndexOperation
	} from '$lib/services/admin/data-source/index-op';
	import { session } from '$lib/stores/user';
	import type { IndexOperation } from '@core/model/data-source/index-op';
	import { indexOperations as indexOperationsTable } from '@core/schema';
	import { createInfiniteQuery } from '@tanstack/svelte-query';
	import Day from 'dayjs';
	import { SolidLineSpinner } from '../loading';

	export let initIndexOps: IndexOperation[] = [];
	export let limit = 50;

	let indexOps: IndexOperation[] = [];
	let isLoading = false;
	let alert: { type: 'error' | 'success'; message: string } | undefined = undefined;

	const query = createInfiniteQuery({
		queryKey: ['infinite-index-operations'],
		queryFn: ({ pageParam = 1 }) =>
			getIndexOperations({ limit, session: $session!, page: pageParam }).then(
				(r) => r.indexOperations
			),
		getNextPageParam: (lastPage, pages) => {
			if (lastPage.length < limit) return undefined;
			return pages.length + 1;
		},
		initialPageParam: 1,
		initialData: {
			pages: [initIndexOps],
			pageParams: [1]
		},
		refetchInterval: 8000
	});
	query.subscribe(({ data, isSuccess }) => {
		if (isSuccess) {
			indexOps = data.pages.flat();
		}
	});

	const handleUpdateStatus = async (
		event: Event & { currentTarget: EventTarget & HTMLSelectElement },
		id: string
	) => {
		const status = event.currentTarget.value as IndexOperation['status'];
		try {
			isLoading = true;
			await updateIndexOperation(id, { status }, { session: $session! });
			alert = { type: 'success', message: `Successfully updated status to ${status}` };
		} catch (e) {
			alert = { type: 'error', message: e instanceof Error ? e.message : 'Unknown error' };
		} finally {
			await $query.refetch();
			isLoading = false;
		}
	};

	$: if (alert) setTimeout(() => (alert = undefined), 8000);
</script>

<div class="relative flex flex-col w-full h-full space-y-2">
	{#if isLoading}
		<div class="absolute left-0 right-0 flex justify-center">
			<SolidLineSpinner size="md" colorscheme={'dark'} />
		</div>
	{/if}
	{#if alert}
		<div class={`absolute left-0 right-0 flex justify-center`}>
			<div
				class={`px-5 mx-auto text-xl rounded-lg outline text-white ${
					alert?.type === 'error' ? 'bg-red-500' : 'bg-green-500'
				}`}
			>
				{alert?.message}
			</div>
		</div>
	{/if}
	<h1 class="text-2xl font-medium">Index Operation Status</h1>
	<div class="w-full h-full overflow-x-scroll">
		<table class="table table-xs">
			<thead>
				<tr>
					<th>ID</th>
					<th>Data Source ID</th>
					<th>Status</th>
					<th>Created</th>
				</tr>
			</thead>
			<tbody>
				{#each indexOps as indexOp}
					<tr>
						<td>{indexOp.id}</td>
						<td>{indexOp.dataSourceId}</td>
						<td
							class={`${
								indexOp.status === 'FAILED'
									? 'text-red-500'
									: indexOp.status === 'SUCCEEDED'
										? 'text-green-500'
										: 'text-yellow-500'
							}`}
						>
							<select on:change={(event) => handleUpdateStatus(event, indexOp.id)}>
								{#each indexOperationsTable.status.enumValues as status}
									<option value={status} selected={status === indexOp.status}>
										{status}
									</option>
								{/each}
							</select>
						</td>
						<td>
							{Day(indexOp.createdAt).format('M/d/Y h:mma')}
						</td>
					</tr>
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
