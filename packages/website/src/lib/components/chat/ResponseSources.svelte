<script lang="ts">
	import { page } from '$app/stores';
	import { getAiResponseSourceDocuments, searchForAiResponses } from '$lib/services/ai-response';
	import type { Query } from '@core/database/helpers';
	import type { SourceDocument } from '@core/model';
	import { aiResponses } from '@core/schema';
	import { getPropertyName } from '@core/util/object';
	import Icon from '@iconify/svelte';
	import { SolidLineSpinner } from '../loading';

	export let aiResponseId: string;
	export let chatId: string | undefined;

	let sources: SourceDocument[] | undefined = undefined;
	let hasFetchedSources = false;
	let isLoading = false;
	let showSources = false;

	$: getSources = async () => {
		if (hasFetchedSources) return;
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

			hasFetchedSources = true;
		} catch (error) {
			console.error(error);
		}
		isLoading = false;
	};

	$: if (showSources) getSources();
</script>

<div class="flex flex-col w-full overflow-hidden grow-0">
	<button
		class="flex flex-row items-center w-full mt-2 space-x-1 cursor-pointer"
		on:click|preventDefault={() => (showSources = !showSources)}
	>
		<div class="text-sm text-blue-400">Sources</div>
		<Icon
			icon="icon-park:right"
			class={`text-sm duration-300 ${showSources ? 'rotate-90' : 'rotate-0'}`}
		/>
	</button>
	{#if isLoading}
		<SolidLineSpinner size="sm" colorscheme={'dark'} />
	{/if}
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
