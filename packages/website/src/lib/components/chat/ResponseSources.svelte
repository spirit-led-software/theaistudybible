<script lang="ts">
	import { PUBLIC_API_URL } from '$env/static/public';
	import { session } from '$lib/stores/user';
	import Icon from '@iconify/svelte';
	import { graphql } from '@revelationsai/client/graphql';
	import type { NeonVectorStoreDocument } from '@revelationsai/core/langchain/vectorstores/neon';
	import { createQuery } from '@tanstack/svelte-query';
	import graphqlRequest from 'graphql-request';
	import { writable } from 'svelte/store';

	export let aiResponseId: string;
	export let isChatLoading = false;

	let showSources = false;

	let sourceDocs = writable<Pick<NeonVectorStoreDocument, 'id' | 'metadata'>[]>([]);

	const graphqlQuery = graphql(`
		query GetAiResponseSourceDocuments($aiResponseId: String!) {
			aiResponse(id: $aiResponseId) {
				id
				sourceDocuments {
					id
					metadata
				}
			}
		}
	`);

	const query = createQuery({
		queryKey: ['aiResponseSourceDocuments', aiResponseId],
		queryFn: async () => {
			return await graphqlRequest(
				`${PUBLIC_API_URL}/graphql`,
				graphqlQuery,
				{
					aiResponseId
				},
				{
					authorization: `Bearer ${$session}`
				}
			);
		}
	});
	query.subscribe(({ data }) => {
		if (data?.aiResponse?.sourceDocuments) {
			sourceDocs.set(
				data.aiResponse.sourceDocuments
					.map((doc) => ({
						id: doc.id,
						metadata: JSON.parse(doc.metadata)
					}))
					.filter(
						(doc, index, arr) => arr.findIndex((d) => d.metadata.url === doc.metadata.url) === index
					)
			);
		}
	});

	$: isLoading = isChatLoading || $query.isLoading;
</script>

<div class="flex flex-col overflow-hidden">
	<button
		class="mt-2 flex w-full cursor-pointer flex-row items-center space-x-1 disabled:cursor-not-allowed disabled:opacity-50"
		on:click|preventDefault={() => {
			showSources = !showSources;
		}}
		disabled={isLoading}
	>
		<div class="text-sm text-blue-400">Sources</div>
		{#if isLoading}
			<span class="loading loading-spinner w-2" />
		{:else}
			<Icon
				icon="icon-park:right"
				class={`text-sm duration-300 ${showSources ? 'rotate-90' : 'rotate-0'}`}
			/>
		{/if}
	</button>
	{#if $sourceDocs.length > 0}
		<ol
			class={`flex w-full list-outside list-decimal flex-col space-y-1 duration-300 ${showSources ? '' : 'hidden'}`}
		>
			{#each $sourceDocs as sourceDoc (sourceDoc.id)}
				<li class={`list-item truncate text-xs text-gray-400`}>
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
		</ol>
	{:else}
		<ul class={`flex w-full flex-col space-y-1 duration-300 ${showSources ? '' : 'hidden'}`}>
			<li class={`truncate text-xs text-gray-400`}>None</li>
		</ul>
	{/if}
</div>
