<script lang="ts">
	import { deleteDataSource, syncDataSource } from '$lib/services/admin/data-source';
	import { session } from '$lib/stores/user';
	import type { DataSource } from '@core/model/data-source';
	import Icon from '@iconify/svelte';
	import { createMutation, useQueryClient, type InfiniteData } from '@tanstack/svelte-query';
	import Day from 'dayjs';
	import type { SvelteComponent } from 'svelte';
	import EditDialog from './EditDialog.svelte';

	export let dataSource: DataSource;

	const client = useQueryClient();

	const getLastSyncDate = (dataSource: DataSource) => {
		if (!dataSource.lastAutomaticSync && !dataSource.lastManualSync) {
			return null;
		}
		if (dataSource.lastAutomaticSync && dataSource.lastManualSync) {
			return Day(dataSource.lastAutomaticSync).isAfter(dataSource.lastManualSync)
				? dataSource.lastAutomaticSync
				: dataSource.lastManualSync;
		}
		return dataSource.lastAutomaticSync || dataSource.lastManualSync;
	};

	const handleDelete = async (id: string) => {
		await deleteDataSource(id, { session: $session! });
	};

	const deleteDataSourceMutation = createMutation({
		mutationFn: handleDelete,
		onMutate: async (id: string) => {
			await client.cancelQueries({ queryKey: ['infinite-data-sources'] });
			const previousDataSources = client.getQueryData<InfiniteData<DataSource[]>>([
				'infinite-data-sources'
			]);
			if (previousDataSources) {
				client.setQueryData<InfiniteData<DataSource[]>>(['infinite-data-sources'], {
					pages: previousDataSources.pages.map((page) => page.filter((c) => c.id !== id)),
					pageParams: previousDataSources.pageParams
				});
			}
			return { previousDataSources };
		},
		onSettled: async () => {
			await client.invalidateQueries({ queryKey: ['infinite-data-sources'] });
		}
	});

	const handleSubmitDelete = async (id: string) => {
		if (confirm('Are you sure you want to delete this data source?')) {
			$deleteDataSourceMutation.mutate(id);
		}
	};

	let editDialog: SvelteComponent | undefined = undefined;
	let isSyncing = false;
	let lastSyncDate = getLastSyncDate(dataSource);

	$: lastSyncDate = getLastSyncDate(dataSource);
</script>

<tr>
	<td>
		<button
			class="btn btn-xs"
			on:click={() => {
				isSyncing = true;
				syncDataSource(dataSource.id, {
					// @ts-expect-error Can't use a bang here
					session: $session
				})
					.catch((e) => {
						console.error(e);
						alert(`Failed to sync data source ${dataSource.name}\n${e}`);
					})
					.finally(async () => {
						await client.invalidateQueries({ queryKey: ['infinite-data-sources'] });
						isSyncing = false;
					});
			}}
		>
			{#if isSyncing}
				<span class="loading loading-spinner loading-xs" />
			{:else}
				Sync
			{/if}
		</button>
	</td>
	<td>{dataSource.id}</td>
	<td>{dataSource.name}</td>
	<td>{dataSource.type}</td>
	<td>{dataSource.syncSchedule}</td>
	<td
		class={lastSyncDate
			? Day(lastSyncDate).isBefore(Day().subtract(10, 'days'))
				? 'text-error'
				: Day(lastSyncDate).isBefore(Day().subtract(3, 'days'))
					? 'text-warning'
					: 'text-success'
			: ''}
	>
		{lastSyncDate ? Day(lastSyncDate).format('M/D/YY h:mma') : 'N/A'}
	</td>
	<td>{dataSource.numberOfDocuments}</td>
	<td class="w-10 py-3 space-y-2">
		<button
			class="btn btn-xs btn-circle"
			on:click={() => {
				editDialog?.show();
			}}
		>
			<Icon icon="mdi:pencil" />
		</button>
		<EditDialog {dataSource} bind:this={editDialog} />
		<button
			class="btn btn-xs btn-error btn-circle"
			on:click={() => {
				handleSubmitDelete(dataSource.id);
			}}
		>
			<Icon icon="mdi:trash-can" />
		</button>
	</td>
	<td />
</tr>
