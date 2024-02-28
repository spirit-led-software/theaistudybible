<script lang="ts">
	import { goto } from '$app/navigation';
	import { PUBLIC_API_URL } from '$env/static/public';
	import { session, user } from '$lib/stores/user';
	import { graphql } from '@revelationsai/client/graphql';
	import { createInfiniteQuery } from '@tanstack/svelte-query';
	import day from 'dayjs';
	import graphqlRequest from 'graphql-request';

	export let userId: string = $user!.id;
	export let limit: number = 5;
	export let searchQuery: string = '';

	const graphqlQuery = graphql(/* GraphQL */ `
		query UserChats($userId: String!, $filter: FilterInput, $limit: Int!, $page: Int!) {
			user(id: $userId) {
				chats(filter: $filter, limit: $limit, page: $page) {
					id
					createdAt
					updatedAt
					name
				}
			}
		}
	`);

	$: query = createInfiniteQuery({
		queryKey: [`user-chats`, userId, searchQuery, limit],
		queryFn: async ({ pageParam = 1 }) => {
			return await graphqlRequest(
				`${PUBLIC_API_URL}/graphql`,
				graphqlQuery,
				{
					userId,
					filter: searchQuery
						? {
								iLike: {
									column: 'name',
									placeholder: `%${searchQuery}%`
								}
							}
						: undefined,
					limit,
					page: pageParam
				},
				{
					authorization: `Bearer ${$session}`
				}
			).then((r) => {
				if (!r.user) {
					throw new Error('User not found');
				}
				return r.user.chats ?? [];
			});
		},
		initialPageParam: 1,
		getNextPageParam: (lastPage, allPages) => {
			if (lastPage.length < limit) return undefined;
			return allPages.length + 1;
		}
	});
</script>

<div class="h-full w-full overflow-scroll p-2">
	<div class="flex justify-between">
		<h2 class="flex w-full px-2 py-1 text-center text-xl font-bold">Chats</h2>
		<input
			class="w-2/3 rounded-md border border-gray-300 px-2 py-1 text-center text-sm"
			type="text"
			placeholder="Search"
			bind:value={searchQuery}
		/>
	</div>
	{#if $query.data}
		<table class="table-sm table">
			<thead class="table-pin-rows">
				<tr>
					<th>Updated</th>
					<th>Name</th>
				</tr>
			</thead>
			<tbody>
				{#each $query.data.pages as page}
					{#each page as chat}
						<tr
							class="hover:cursor-pointer"
							on:click={async () => await goto(`/admin/chats/${chat.id}`)}
						>
							<td>{day(chat.updatedAt).format('M/D/YY')}</td>
							<td>{chat.name}</td>
						</tr>
					{/each}
				{/each}
				<tr class="w-full">
					<td class="w-full" colspan={Number.MAX_SAFE_INTEGER}>
						{#if $query.isFetchingNextPage}
							<div class="flex place-items-center justify-center">
								<span class="loading loading-spinner" />
							</div>
						{:else if $query.hasNextPage}
							<button class="btn w-full" on:click={() => $query.fetchNextPage()}> Load more</button>
						{/if}
					</td>
				</tr>
			</tbody>
		</table>
	{:else if $query.isFetching}
		<div class="flex h-52 flex-col place-items-center justify-center">
			<span class="loading loading-spinner" />
		</div>
	{:else if $query.isError}
		<div class="flex h-52 flex-col place-items-center justify-center">
			<span class="text-red-500">Error loading chats</span>
			<button class="btn" on:click={() => $query.refetch()}>Retry</button>
		</div>
	{:else}
		<div class="flex h-52 flex-col place-items-center justify-center">
			<span class="text-red-500">No chats found</span>
		</div>
	{/if}
</div>
