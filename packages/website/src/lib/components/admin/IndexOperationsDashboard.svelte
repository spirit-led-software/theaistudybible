<script lang="ts">
	import { getIndexOperations, updateIndexOperation } from '$lib/services/index-op';
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
			await $query?.refetch();
			isLoading = false;
		}
	};

	$: query = createQuery({
		queryKey: ['index-operations'],
		queryFn: () => getIndexOperations({ limit, session: $session! }).then((r) => r.indexOperations),
		initialData: initIndexOps,
		refetchInterval: 8000
	});

	$: query?.subscribe(({ data }) => {
		indexOps = data ?? [];
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
	<h1 class="text-xl font-medium">Index Operation Status</h1>
	{#if indexOps.length > 0}
		<div class="w-full h-full overflow-scroll border">
			<table class="w-full text-left whitespace-normal divide-y table-fixed divide-slate-800">
				<thead>
					<tr class="divide-x divide-slate-800 bg-slate-200">
						<th class="px-2 py-1">ID</th>
						<th class="px-2 py-1">Status</th>
						<th class="px-2 py-1">Created</th>
						<th class="px-2 py-1">Metadata</th>
					</tr>
				</thead>
				<tbody class="divide-y-2">
					{#each indexOps as indexOp}
						<tr class="divide-x-2">
							<td class="px-2 py-1">{indexOp.id}</td>
							<td
								class={`px-2 py-1 ${
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
							<td class="px-2 py-1">
								{Moment(indexOp.createdAt).format('M/d/Y h:mma')}
							</td>
							<td class="px-2 py-1 overflow-x-scroll whitespace-nowrap">
								{#if indexOp.metadata}
									<table class="table-fixed">
										<tbody>
											{#each Object.entries(indexOp.metadata) as [key, value]}
												<tr class="divide-x-2">
													<td class="pr-2">{key}</td>
													<td class="pr-2">
														{JSON.stringify(value)}
													</td>
												</tr>
											{/each}
										</tbody>
									</table>
								{:else}
									"None"
								{/if}
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	{:else}
		<div>None yet</div>
	{/if}
</div>
