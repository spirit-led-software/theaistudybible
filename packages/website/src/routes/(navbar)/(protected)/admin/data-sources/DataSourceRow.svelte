<script lang="ts">
	import { deleteDataSource, syncDataSource } from '$lib/services/data-source';
	import { session } from '$lib/stores/user';
	import type { DataSource } from '@core/model';
	import Icon from '@iconify/svelte';
	import { createMutation, useQueryClient, type InfiniteData } from '@tanstack/svelte-query';
	import Moment from 'moment';
	import type { SvelteComponent } from 'svelte';
	import EditDialog from './EditDialog.svelte';

	export let dataSource: DataSource;

	let editDialog: SvelteComponent | undefined = undefined;
	let isSyncing = false;

	const client = useQueryClient();

	const getLastSyncDate = (dataSource: DataSource): string => {
		if (!dataSource.lastAutomaticSync && !dataSource.lastManualSync) {
			return 'N/A';
		}
		if (dataSource.lastAutomaticSync && dataSource.lastManualSync) {
			return Moment(dataSource.lastAutomaticSync).isAfter(dataSource.lastManualSync)
				? Moment(dataSource.lastAutomaticSync).format('M/D/YY h:mma')
				: Moment(dataSource.lastManualSync).format('M/D/YY h:mma');
		}
		return Moment(dataSource.lastAutomaticSync || dataSource.lastManualSync).format('M/D/YY h:mma');
	};

	const handleDelete = async (id: string) => {
		await deleteDataSource(id, { session: $session! });
	};

	const deleteDataSourceMutation = createMutation({
		mutationFn: handleDelete,
		onMutate: async (id: string) => {
			await client.cancelQueries(['infinite-data-sources']);
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
			await client.invalidateQueries(['infinite-data-sources']);
		}
	});

	const handleSubmitDelete = async (id: string) => {
		if (confirm('Are you sure you want to delete this data source?')) {
			$deleteDataSourceMutation.mutate(id);
		}
	};
</script>

<tr>
	<td>
		<button
			class="btn btn-xs"
			on:click={() => {
				isSyncing = true;
				syncDataSource(dataSource.id, {
					// @ts-ignore
					session: $session
				})
					.catch((e) => {
						console.error(e);
						alert(`Failed to sync data source ${dataSource.name}\n${e}`);
					})
					.finally(async () => {
						await client.invalidateQueries(['infinite-data-sources']);
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
	<td>{dataSource.name}</td>
	<td>{dataSource.type}</td>
	<td>{dataSource.syncSchedule}</td>
	<td>{getLastSyncDate(dataSource)}</td>
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
