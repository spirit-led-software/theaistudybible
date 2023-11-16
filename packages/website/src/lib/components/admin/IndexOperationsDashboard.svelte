<script lang="ts">
	import { getIndexOperations, updateIndexOperation } from '$lib/services/data-source/index-op';
	import { session } from '$lib/stores/user';
	import type { IndexOperation } from '@core/model';
	import { indexOperations as indexOperationsTable } from '@core/schema';
	import { createQuery } from '@tanstack/svelte-query';
	import Moment from 'moment';
	import { SolidLineSpinner } from '../loading';

	export let initIndexOps: IndexOperation[] = [];

	let limit = 100;
	let indexOps: IndexOperation[] = [];
	let isLoading = false;
	let alert: { type: 'error' | 'success'; message: string } | undefined = undefined;

	const handleUpdateStatus = async (
		event: Event & { currentTarget: EventTarget & HTMLSelectElement },
		id: string
	) => {
		const status = event.currentTarget.value;
		try {
			isLoading = true;
			await updateIndexOperation(id, { status: status as any }, { session: $session! });
			alert = { type: 'success', message: `Successfully updated status to ${status}` };
		} catch (e: any) {
			alert = { type: 'error', message: e.message };
		} finally {
			await $query.refetch();
			isLoading = false;
		}
	};

	const query = createQuery({
		queryKey: ['index-operations'],
		queryFn: () => getIndexOperations({ limit, session: $session! }).then((r) => r.indexOperations),
		initialData: initIndexOps,
		refetchInterval: 8000
	});
	query.subscribe(({ data, isSuccess }) => {
		if (isSuccess) {
			indexOps = data;
		}
	});

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
							{Moment(indexOp.createdAt).format('M/d/Y h:mma')}
						</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
</div>
