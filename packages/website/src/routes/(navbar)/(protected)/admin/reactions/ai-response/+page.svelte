<script lang="ts">
	import { session } from '$lib/stores/user';
	import Icon from '@iconify/svelte';
	import { getAiResponseReactions } from '@revelationsai/client/services/admin/reactions/ai-response';
	import type { AiResponseReactionInfo } from '@revelationsai/core/model/ai-response/reaction';
	import { createInfiniteQuery } from '@tanstack/svelte-query';
	import type { PageData } from './$types';

	export let data: PageData;

	let reactionInfos: AiResponseReactionInfo[] = [];

	const fetchFn = async ({ pageParam = 1 }) => {
		return await getAiResponseReactions({
			limit: data.limit,
			page: pageParam,
			session: $session!
		}).then((r) => r.reactions);
	};

	const query = createInfiniteQuery({
		queryKey: ['infinite-ai-response-reaction-infos'],
		queryFn: fetchFn,
		initialPageParam: 1,
		getNextPageParam: (lastPage, pages) => {
			if (lastPage.length < data.limit) return undefined;
			return pages.length + 1;
		},
		initialData: {
			pages: [data.reactionInfos],
			pageParams: [1]
		}
	});
	query.subscribe(({ data, isSuccess }) => {
		if (isSuccess) {
			reactionInfos = data.pages.flat();
		}
	});
</script>

<div class="flex flex-col w-full h-full p-5 space-y-5">
	<div class="w-full h-full overflow-auto">
		<table class="table whitespace-normal">
			<thead>
				<tr>
					<th>Reaction</th>
					<th>User</th>
					<th>Comment</th>
					<th>Response</th>
				</tr>
			</thead>
			<tbody>
				{#each reactionInfos as reactionInfo}
					<tr>
						<td>
							{#if reactionInfo.reaction === 'LIKE'}
								<Icon icon="mdi:thumb-up" class="text-green-500" />
							{:else if reactionInfo.reaction === 'DISLIKE'}
								<Icon icon="mdi:thumb-down" class="text-red-500" />
							{/if}
						</td>
						<td>{reactionInfo.user.name || reactionInfo.user.email}</td>
						<td>{reactionInfo.comment || 'None'}</td>
						<td>{reactionInfo.response.text}</td>
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
