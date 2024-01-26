<script lang="ts">
	import Avatar from '$lib/components/user/Avatar.svelte';
	import { session } from '$lib/stores/user';
	import Icon from '@iconify/svelte';
	import { deleteUser, getUserRoles } from '@revelationsai/client/services/admin/user';
	import type { DataSource } from '@revelationsai/core/model/data-source';
	import type { User } from '@revelationsai/core/model/user';
	import {
		createMutation,
		createQuery,
		useQueryClient,
		type InfiniteData
	} from '@tanstack/svelte-query';
	import Day from 'dayjs';

	export let user: User;

	const client = useQueryClient();

	const rolesQuery = createQuery({
		queryKey: ['user-roles', user.id],
		queryFn: async () => {
			return await getUserRoles(user.id, { session: $session! });
		}
	});

	const handleDelete = async (id: string) => {
		await deleteUser(id, { session: $session! });
	};

	const deleteDataSourceMutation = createMutation({
		mutationFn: handleDelete,
		onMutate: async (id: string) => {
			await client.cancelQueries({ queryKey: ['infinite-users'] });
			const previousDataSources = client.getQueryData<InfiniteData<DataSource[]>>([
				'infinite-users'
			]);
			if (previousDataSources) {
				client.setQueryData<InfiniteData<DataSource[]>>(['infinite-users'], {
					pages: previousDataSources.pages.map((page) => page.filter((c) => c.id !== id)),
					pageParams: previousDataSources.pageParams
				});
			}
			return { previousDataSources };
		},
		onSettled: async () => {
			await client.invalidateQueries({ queryKey: ['infinite-users'] });
		}
	});

	const handleSubmitDelete = async (id: string) => {
		if (confirm('Are you sure you want to delete this user?')) {
			$deleteDataSourceMutation.mutate(id);
		}
	};
</script>

<tr class="h-16">
	<td>
		<Avatar {user} />
	</td>
	<td>{user.id}</td>
	<td>{user.name || 'N/A'}</td>
	<td>{user.email}</td>
	<td class="flex flex-col h-full overflow-y-scroll space-y-1 py-2">
		{#if $rolesQuery.data}
			{#each $rolesQuery.data as role (role.id)}
				<span class="bg-slate-700 rounded-lg text-white p-1 text-center">{role.name}</span>
			{/each}
		{:else if $rolesQuery.isError}
			<span class="text-red-500">Error</span>
		{:else}
			<span class="loading loading-spinner loading-sm" />
		{/if}
	</td>
	<td>{Day(user.createdAt).format('YYYY-MM-DD')}</td>
	<td class="w-10 py-3 space-y-2">
		<button
			class="btn btn-xs btn-error btn-circle"
			on:click={() => {
				handleSubmitDelete(user.id);
			}}
		>
			<Icon icon="mdi:trash-can" />
		</button>
	</td>
	<td />
</tr>
