<script lang="ts">
	import { PUBLIC_API_URL } from '$env/static/public';
	import type { SourceDocument } from '@core/model';
	import type { devotionReactions } from '@core/schema';
	import Iconify from '@iconify/svelte';
	import Moment from 'moment';
	import type { PageData } from './$types';

	export let data: PageData;

	const { devotion: activeDevo, sourceDocs, images, reactionCounts } = data;

	let isLoading = false;
	let likeCount = reactionCounts?.LIKE || 0;
	let dislikeCount = reactionCounts?.DISLIKE || 0;
	let alert: string | undefined = undefined;

	let sourceDocuments: SourceDocument[] = sourceDocs?.filter(
		(sourceDoc: SourceDocument, index: number) => {
			const firstIndex = sourceDocs.findIndex(
				(otherSourceDoc: SourceDocument) =>
					(sourceDoc.metadata as any).name === (otherSourceDoc.metadata as any).name
			);
			return firstIndex === index;
		}
	);

	const handleReaction = async (
		reaction: (typeof devotionReactions.reaction.enumValues)[number]
	) => {
		isLoading = true;
		try {
			if (reaction === 'LIKE') {
				likeCount++;
			} else if (reaction === 'DISLIKE') {
				dislikeCount++;
			}

			const response = await fetch(`${PUBLIC_API_URL}/devotions/${activeDevo.id}/reactions`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					reaction: reaction
				})
			});
			if (!response.ok) {
				// Revert reaction count
				if (reaction === 'LIKE') {
					likeCount--;
				} else if (reaction === 'DISLIKE') {
					dislikeCount--;
				}

				const { error } = await response.json();
				throw new Error(error ?? 'An unknown error occurred.');
			}
		} catch (error: any) {
			console.error(error);
			alert = error.message;
		}
		isLoading = false;
	};

	$: if (alert) {
		setTimeout(() => {
			alert = undefined;
		}, 8000);
	}
</script>

<div class="absolute flex flex-col w-full h-full overflow-y-scroll lg:static">
	<div class="relative flex flex-col w-full px-5 pt-5 pb-20 space-y-5">
		<div class="fixed z-20 flex justify-between space-x-1 bottom-3 right-3">
			<button
				disabled={isLoading}
				on:click|preventDefault={() => handleReaction('LIKE')}
				class="text-center rounded-full group bg-slate-300 hover:bg-slate-400 bg-opacity-90"
			>
				<span class="mr-2">{likeCount}</span>
				<Iconify icon="fa6-regular:thumbs-up" class="text-white group-hover:text-green-400" />
			</button>
			<button
				disabled={isLoading}
				on:click|preventDefault={() => handleReaction('DISLIKE')}
				class="text-center rounded-full group bg-slate-300 hover:bg-slate-400 bg-opacity-90"
			>
				<span class="mr-2">{dislikeCount}</span>
				<Iconify icon="fa6-regular:thumbs-down" class="text-white group-hover:text-red-400" />
			</button>
		</div>
		<div
			role="alert"
			class={`absolute left-0 right-0 flex justify-center duration-300 ${
				alert ? 'scale-100 top-1' : 'scale-0 -top-20'
			}`}
		>
			<div class="w-2/3 py-2 overflow-hidden text-center text-white truncate bg-red-400 rounded-lg">
				{alert}
			</div>
		</div>
		<h1 class="mb-2 text-2xl font-bold text-center lg:text-left">
			{Moment(activeDevo.createdAt).format('MMMM Do YYYY')}
		</h1>
		{#if !activeDevo.prayer || !activeDevo.reflection || images.length === 0}
			<div
				class="flex flex-col justify-center w-full place-items-center lg:place-items-start lg:justify-start"
			>
				<div
					class="flex justify-center w-3/4 px-3 py-2 mx-auto text-white bg-red-300 place-items-center rounded-xl lg:mx-0 lg:w-fit"
				>
					<span class="mr-3">
						<Iconify icon="material-symbols:warning-outline" class="text-xl" />
					</span>
					This devotion uses an old format. Some of the content may be missing or incorrect. We apologize
					for this inconvenience.
				</div>
			</div>
		{/if}
		{#if activeDevo.bibleReading}
			<div class="flex flex-col w-full mb-3 break-words whitespace-pre-wrap">
				<h2 class="mb-2 text-xl font-bold text-center lg:text-left">Reading</h2>
				<div class="flex flex-col w-full">
					{activeDevo.bibleReading}
				</div>
			</div>
		{/if}
		{#if activeDevo.summary}
			<div class="flex flex-col w-full mb-3 break-words whitespace-pre-wrap">
				<h2 class="mb-2 text-xl font-bold text-center lg:text-left">Summary</h2>
				<div class="flex flex-col w-full">{activeDevo.summary}</div>
			</div>
		{/if}
		{#if activeDevo.reflection}
			<div class="flex flex-col w-full mb-3 break-words whitespace-pre-wrap">
				<h2 class="mb-2 text-xl font-bold text-center lg:text-left">Reflection</h2>
				<div class="flex flex-col w-full">
					{activeDevo.reflection}
				</div>
			</div>
		{/if}
		{#if activeDevo.prayer}
			<div class="flex flex-col w-full mb-3 break-words whitespace-pre-wrap">
				<h2 class="mb-2 text-xl font-bold text-center lg:text-left">Prayer</h2>
				<div class="flex flex-col w-full">{activeDevo.prayer}</div>
			</div>
		{/if}
		{#if images && images.length > 0}
			<div class="flex flex-col w-full">
				<h2 class="mb-2 text-xl font-bold text-center lg:text-left">Generated Image(s)</h2>
				{#if images[0].caption}
					<p class="mb-2 text-sm text-center">{images[0].caption}</p>
				{/if}
				<div class="flex flex-col w-full text-center lg:flex-row lg:space-x-5">
					{#each images as image (image.id)}
						<div class="flex flex-col w-full">
							<img
								src={image.url}
								alt={image.caption}
								width={512}
								height={512}
								class="mx-auto mb-2 rounded-lg shadow-md lg:float-right lg:ml-5"
							/>
							<p class="text-xs text-center">
								This image was generated by AI from the devotion text.
							</p>
						</div>
					{/each}
				</div>
			</div>
		{/if}
		{#if sourceDocuments && sourceDocuments.length > 0}
			<div class="flex flex-col w-full mt-5">
				<h2 class="mb-2 font-bold">Sources</h2>
				<ul class="flex flex-col space-y-2 text-xs list-decimal list-inside text-slate-400">
					{#each sourceDocuments as sourceDoc (sourceDoc.id)}
						<li>
							<a
								href={sourceDoc.metadata.url}
								target="_blank"
								rel="noopener noreferrer"
								class="hover:text-slate-500 hover:underline"
							>
								{sourceDoc.metadata.name}
							</a>
						</li>
					{/each}
				</ul>
			</div>
		{/if}
	</div>
</div>
