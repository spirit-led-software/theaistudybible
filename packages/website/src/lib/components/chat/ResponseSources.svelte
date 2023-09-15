<script lang="ts">
	import { page } from '$app/stores';
	import { getAiResponseSourceDocuments, searchForAiResponses } from '$lib/services/ai-response';
	import type { Query } from '@core/database/helpers';
	import { aiResponses } from '@core/schema';
	import { getPropertyName } from '@core/util/object';
	import type { NeonVectorStoreDocument } from '@core/vector-db/neon';
	import Icon from '@iconify/svelte';
	import { onMount } from 'svelte';

	export let aiResponseId: string;
	export let isChatLoading = false;
	export let chatId: string | undefined;

	let sources: NeonVectorStoreDocument[] = [];
	let isLoading = false;
	let showSources = false;

	onMount(() => {
		getSources(chatId, aiResponseId);
	});

	$: getSources = async (chatId?: string, aiResponseId?: string) => {
		if (sources.length === 0) {
			try {
				isLoading = true;
				let query: Query = {
					AND: []
				};
				if (aiResponseId) {
					query.AND!.push({
						eq: {
							column: getPropertyName(aiResponses, (aiResponses) => aiResponses.aiId),
							value: aiResponseId
						}
					});
				}
				if (chatId) {
					query.AND!.push({
						eq: {
							column: getPropertyName(aiResponses, (aiResponses) => aiResponses.chatId),
							value: chatId
						}
					});
				}
				const { aiResponses: foundAiResponses } = await searchForAiResponses({
					session: $page.data.session,
					query,
					limit: 1
				});
				const aiResponse = foundAiResponses[0];

				const foundSourceDocuments = await getAiResponseSourceDocuments(aiResponse.id, {
					session: $page.data.session
				});
				sources = foundSourceDocuments.filter((sourceDoc, index) => {
					const firstIndex = foundSourceDocuments.findIndex(
						(otherSourceDoc) =>
							(sourceDoc.metadata as any).name === (otherSourceDoc.metadata as any).name
					);
					return firstIndex === index;
				});
			} catch (error) {
				console.error(error);
			} finally {
				isLoading = false;
			}
		}
	};

	$: if (showSources) getSources(chatId, aiResponseId);
	$: if (!isChatLoading) getSources(chatId, aiResponseId);
</script>

<div class="flex flex-col overflow-hidden">
	<button
		class="flex flex-row items-center w-full mt-2 space-x-1 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
		on:click|preventDefault={() => (showSources = !showSources)}
		disabled={isLoading}
	>
		<div class="text-sm text-blue-400">Sources</div>
		{#if isLoading}
			<span class="w-2 loading loading-spinner" />
		{:else}
			<Icon
				icon="icon-park:right"
				class={`text-sm duration-300 ${showSources ? 'rotate-90' : 'rotate-0'}`}
			/>
		{/if}
	</button>
	{#if sources}
		<ul class={`flex flex-col w-full space-y-1 duration-300 ${showSources ? '' : 'hidden'}`}>
			{#each sources as sourceDoc (sourceDoc.id)}
				<li class={`text-xs text-gray-400 truncate`}>
					<a
						href={sourceDoc.metadata.url ?? '#'}
						target="_blank"
						rel="noopener noreferrer"
						class="hover:underline"
					>
						{sourceDoc.metadata.name}
					</a>
				</li>
			{/each}
		</ul>
	{/if}
</div>
