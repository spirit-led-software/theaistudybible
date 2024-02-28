<script lang="ts">
	import { PUBLIC_API_URL } from '$env/static/public';
	import { session, user } from '$lib/stores/user';
	import { graphql } from '@revelationsai/client/graphql';
	import { createInfiniteQuery } from '@tanstack/svelte-query';
	import day from 'dayjs';
	import graphqlRequest from 'graphql-request';

	export let userId: string = $user!.id;
	export let limit: number = 5;

	const chatsQuery = graphql(/* GraphQL */ `
		query UserChats($userId: String!, $limit: Int!, $page: Int!) {
			user(id: $userId) {
				chats(limit: $limit, page: $page) {
					id
					createdAt
					updatedAt
					name
				}
			}
		}
	`);

	$: query = createInfiniteQuery({
		queryKey: [`user-chats-${userId}`],
		queryFn: async ({ pageParam = 1 }) => {
			return await graphqlRequest(
				`${PUBLIC_API_URL}/graphql`,
				chatsQuery,
				{
					userId,
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
	<h2 class="flex w-full px-2 py-1 text-center text-xl font-bold">Chats</h2>
	{#if $query.data}
		<table class="table-sm table">
			<thead class="table-pin-rows">
				<tr>
					<th>Created</th>
					<th>Updated</th>
					<th>Name</th>
				</tr>
			</thead>
			<tbody>
				{#each $query.data.pages as page}
					{#each page as chat}
						<tr>
							<td>{day(chat.createdAt).format('M/D/YY')}</td>
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
		<div class="loading loading-spinner" />
	{:else if $query.isError}
		<div class="text-red-500">{JSON.stringify($query.error)}</div>
	{:else}
		<div>No chats found</div>
	{/if}
</div>
