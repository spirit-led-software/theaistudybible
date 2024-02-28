<script lang="ts">
	import { PUBLIC_API_URL } from '$env/static/public';
	import { session, user } from '$lib/stores/user';
	import { graphql } from '@revelationsai/client/graphql';
	import { createQuery } from '@tanstack/svelte-query';
	import graphqlRequest from 'graphql-request';

	export let userId: string = $user!.id;

	const graphqlQuery = graphql(`
		query UserDevotionReactions($userId: String!) {
			user(id: $userId) {
				roles {
					id
					name
				}
			}
		}
	`);

	$: query = createQuery({
		queryKey: ['user-devotion-reactions', userId],
		queryFn: async () => {
			return await graphqlRequest(
				`${PUBLIC_API_URL}/graphql`,
				graphqlQuery,
				{
					userId
				},
				{
					authorization: `Bearer ${$session}`
				}
			).then((r) => {
				if (!r.user) {
					throw new Error('User not found');
				}
				return r.user.roles ?? [];
			});
		}
	});
</script>

<div class="h-full w-full overflow-scroll p-2">
	<h2 class="flex w-full px-2 py-1 text-center text-xl font-bold">Roles</h2>
	{#if $query.data}
		<table class="table-sm table">
			<thead class="table-pin-rows">
				<tr>
					<th>Role Name</th>
				</tr>
			</thead>
			<tbody>
				{#each $query.data as role}
					<tr>
						<td>{role.name}</td>
					</tr>
				{/each}
			</tbody>
		</table>
	{:else if $query.isFetching}
		<div class="flex h-52 flex-col place-items-center justify-center">
			<span class="loading loading-spinner" />
		</div>
	{:else if $query.isError}
		<div class="flex h-52 flex-col place-items-center justify-center">
			<span class="text-red-500">Error loading roles</span>
			<button class="btn" on:click={() => $query.refetch()}>Retry</button>
		</div>
	{:else}
		<div class="flex h-52 flex-col place-items-center justify-center">
			<span class="text-red-500">No roles found</span>
		</div>
	{/if}
</div>
