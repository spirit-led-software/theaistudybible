<script lang="ts">
	import { session } from '$lib/stores/user';
	import Icon from '@iconify/svelte';
	import {
		getAiResponseSourceDocuments,
		searchForAiResponses
	} from '@revelationsai/client/services/ai-response';
	import type { Query } from '@revelationsai/core/database/helpers';
	import { aiResponses } from '@revelationsai/core/database/schema';
	import type { NeonVectorStoreDocument } from '@revelationsai/core/langchain/vectorstores/neon';
	import { getPropertyName } from '@revelationsai/core/util/object';
	import { validate as uuidValidate } from 'uuid';

	export let chatId: string | undefined;
	export let aiResponseId: string;
	export let isChatLoading = false;

	let sources: NeonVectorStoreDocument[] = [];
	let isLoading = false;
	let hasLoaded = false;
	let tryCount = 0;
	let showSources = false;

	const maxTries = 5;

	$: fetchSources = async (chatId?: string, aiResponseId?: string) => {
		tryCount++;

		if (!chatId && !aiResponseId) {
			await new Promise((resolve) => setTimeout(resolve, 1000 * tryCount));
			return;
		}

		try {
			isLoading = true;
			let query: Query = {
				AND: [
					{
						eq: {
							column: getPropertyName(aiResponses, (aiResponses) =>
								uuidValidate(aiResponseId!) ? aiResponses.id : aiResponses.aiId
							),
							value: aiResponseId
						}
					},
					{
						eq: {
							column: getPropertyName(aiResponses, (aiResponses) => aiResponses.chatId),
							value: chatId
						}
					}
				]
			};
			const { aiResponses: foundAiResponses } = await searchForAiResponses({
				session: $session!,
				query,
				limit: 1
			});
			const aiResponse = foundAiResponses[0];
			if (!aiResponse) return;

			const foundSourceDocuments = await getAiResponseSourceDocuments(aiResponse.id, {
				session: $session!
			});
			sources = foundSourceDocuments.filter((sourceDoc, index) => {
				const firstIndex = foundSourceDocuments.findIndex((otherSourceDoc) => {
					return sourceDoc.metadata.url === otherSourceDoc.metadata.url;
				});
				return firstIndex === index;
			});
			hasLoaded = true;
		} catch (error) {
			console.error(error);
		} finally {
			isLoading = false;
		}
	};

	$: fetchSourcesHandler = () => {
		if (!hasLoaded && !isLoading && tryCount < maxTries && sources.length === 0 && !isChatLoading) {
			fetchSources(chatId, aiResponseId);
		}
	};

	$: if (showSources) {
		fetchSourcesHandler();
	}

	$: fetchSourcesHandler();
</script>

<div class="flex flex-col overflow-hidden">
	<button
		class="flex flex-row items-center w-full mt-2 space-x-1 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
		on:click|preventDefault={() => {
			showSources = !showSources;
		}}
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
	{#if sources && sources.length > 0}
		<ul class={`flex flex-col w-full space-y-1 duration-300 ${showSources ? '' : 'hidden'}`}>
			{#each sources as sourceDoc (sourceDoc.id)}
				<li class={`text-xs text-gray-400 truncate`}>
					<a
						href={sourceDoc.metadata.url ?? '#'}
						target="_blank"
						rel="noopener noreferrer"
						class="hover:underline"
					>
						<span>{sourceDoc.metadata.title ?? sourceDoc.metadata.name}</span>
						{#if sourceDoc.metadata.author}
							<span class="ml-1 text-slate-500">by {sourceDoc.metadata.author}</span>
						{/if}
					</a>
				</li>
			{/each}
		</ul>
	{:else if hasLoaded}
		<ul class={`flex flex-col w-full space-y-1 duration-300 ${showSources ? '' : 'hidden'}`}>
			<li class={`text-xs text-gray-400 truncate`}>None</li>
		</ul>
	{/if}
</div>
