<script lang="ts">
	import { goto } from '$app/navigation';
	import { PUBLIC_API_URL } from '$env/static/public';
	import { session, user } from '$lib/stores/user';
	import Icon from '@iconify/svelte';
	import { graphql } from '@revelationsai/client/graphql';
	import { toTitleCase } from '@revelationsai/core/util/string';
	import { createInfiniteQuery } from '@tanstack/svelte-query';
	import day from 'dayjs';
	import graphqlRequest from 'graphql-request';

	export let userId: string = $user!.id;
	export let limit: number = 5;
	export let sort: {
		field: string;
		order: 'asc' | 'desc';
	}[] = [{ field: 'updatedAt', order: 'desc' }];

	const updateSort = (field: string) => {
		const inList = sort.findIndex((s) => s.field === field);
		if (inList === -1) {
			sort = [
				...sort,
				{
					field,
					order: 'desc'
				}
			];
		} else {
			if (sort[inList].order === 'asc') {
				sort[inList].order = 'desc';
			} else if (sort[inList].order === 'desc') {
				sort[inList].order = 'asc';
			} else {
				sort = sort.filter((s) => s.field !== field);
			}
		}
	};

	const sortContains = (field: string) => {
		return sort.findIndex((s) => s.field === field);
	};

	const graphqlQuery = graphql(`
		query UserDevotionReactions($userId: String!, $limit: Int!, $page: Int!, $sort: [SortInput!]!) {
			user(id: $userId) {
				devotionReactions(limit: $limit, page: $page, sort: $sort) {
					id
					createdAt
					updatedAt
					reaction
					devotion {
						id
						createdAt
						topic
						bibleReading
					}
				}
			}
		}
	`);

	$: query = createInfiniteQuery({
		queryKey: [`user-devotion-reactions-${userId}`],
		queryFn: async ({ pageParam = 1 }) => {
			return await graphqlRequest(
				`${PUBLIC_API_URL}/graphql`,
				graphqlQuery,
				{
					userId,
					limit,
					page: pageParam,
					sort
				},
				{
					authorization: `Bearer ${$session}`
				}
			).then((r) => {
				if (!r.user) {
					throw new Error('User not found');
				}
				return r.user.devotionReactions ?? [];
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
	<h2 class="flex w-full px-2 py-1 text-center text-xl font-bold">Devotion Reactions</h2>
	{#if $query.data}
		<table class="table-sm table">
			<thead class="table-pin-rows">
				<tr>
					<th class="flex" on:click={() => updateSort('updatedAt')}>
						Reaction Date
						{#if sortContains('updatedAt') !== -1}
							{@const index = sortContains('updatedAt')}
							<Icon
								icon={`bi:arrow-${sort[index].order === 'asc' ? 'up' : 'down'}`}
								class="h-4 w-4"
							/>
						{/if}
					</th>
					<th on:click={() => updateSort('reaction')}>
						Reaction
						{#if sortContains('reaction') !== -1}
							{@const index = sortContains('reaction')}
							<Icon
								icon={`bi:arrow-${sort[index].order === 'asc' ? 'up' : 'down'}`}
								class="h-4 w-4"
							/>
						{/if}
					</th>
					<th on:click={() => updateSort('createdAt')}>
						Devo Date
						{#if sortContains('createdAt') !== -1}
							{@const index = sortContains('createdAt')}
							<Icon
								icon={`bi:arrow-${sort[index].order === 'asc' ? 'up' : 'down'}`}
								class="h-4 w-4"
							/>
						{/if}
					</th>
					<th on:click={() => updateSort('topic')}>Topic</th>
					<th on:click={() => updateSort('bibleReading')}>Bible Reading</th>
				</tr>
			</thead>
			<tbody>
				{#each $query.data.pages as page}
					{#each page as reaction}
						<tr
							class="hover:cursor-pointer"
							on:click={async () => await goto(`/devotions/${reaction.devotion?.id}`)}
						>
							<td>{day(reaction.updatedAt).format('M/D/YY')}</td>
							<td>{reaction.reaction}</td>
							<td>{day(reaction.devotion?.createdAt).format('M/D/YY')}</td>
							<td>{toTitleCase(reaction.devotion?.topic ?? '')}</td>
							<td>{reaction.devotion?.bibleReading.split('-')[0]}</td>
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
			<span class="text-red-500">Error loading reactions</span>
			<button class="btn" on:click={() => $query.refetch()}>Retry</button>
		</div>
	{:else}
		<div class="flex h-52 flex-col place-items-center justify-center">
			<span class="text-red-500">No reactions found</span>
		</div>
	{/if}
</div>
