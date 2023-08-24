<script lang="ts">
	/* @ts-ignore */
	import { Email, Facebook, Twitter } from 'svelte-share-buttons-component';

	import { page } from '$app/stores';
	import { PUBLIC_API_URL } from '$env/static/public';
	import type { devotionReactions } from '@core/schema';
	import type { NeonVectorStoreDocument } from '@core/vector-db/neon';
	import { default as Icon, default as Iconify } from '@iconify/svelte';
	import Moment from 'moment';
	import type { PageData } from './$types';

	export let data: PageData;

	let isLoading = false;
	let alert: string | undefined = undefined;
	let shareModal: HTMLDialogElement | undefined = undefined;

	$: handleReaction = async (reaction: (typeof devotionReactions.reaction.enumValues)[number]) => {
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
					'Content-Type': 'application/json',
					Authorization: `Bearer ${$page.data.session}`
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

	$: ({ devotion: activeDevo, sourceDocs, images, reactionCounts } = data);
	$: likeCount = reactionCounts?.LIKE || 0;
	$: dislikeCount = reactionCounts?.DISLIKE || 0;
	$: sourceDocuments = sourceDocs?.filter((sourceDoc: NeonVectorStoreDocument, index: number) => {
		const firstIndex = sourceDocs.findIndex(
			(otherSourceDoc: NeonVectorStoreDocument) =>
				(sourceDoc.metadata as any).name === (otherSourceDoc.metadata as any).name
		);
		return firstIndex === index;
	});

	$: if (alert) setTimeout(() => (alert = undefined), 8000);

	$: cleanDate = Moment(activeDevo.createdAt).format('MMMM Do YYYY');
</script>

<svelte:head>
	<title>
		{cleanDate}: {activeDevo.bibleReading.substring(0, activeDevo.bibleReading.indexOf(' -'))}
	</title>
</svelte:head>

<div class="absolute flex flex-col w-full h-full overflow-y-scroll lg:static">
	<div class="relative flex flex-col w-full px-5 pt-5 pb-20 space-y-5">
		<div class="fixed z-20 flex justify-between space-x-1 bottom-3 right-3">
			<button
				disabled={isLoading}
				on:click|preventDefault={() => handleReaction('LIKE')}
				class="flex justify-center px-3 py-2 text-center text-white rounded-full place-items-center group bg-slate-300 hover:bg-slate-400 bg-opacity-90"
			>
				<span class="mr-2">{likeCount}</span>
				<Iconify icon="fa6-regular:thumbs-up" class="group-hover:text-green-400" />
			</button>
			<button
				disabled={isLoading}
				on:click|preventDefault={() => handleReaction('DISLIKE')}
				class="flex justify-center px-3 py-2 text-center text-white rounded-full place-items-center group bg-slate-300 hover:bg-slate-400 bg-opacity-90"
			>
				<span class="mr-2">{dislikeCount}</span>
				<Iconify icon="fa6-regular:thumbs-down" class="group-hover:text-red-400" />
			</button>
			<dialog bind:this={shareModal} class="modal">
				<form method="dialog" class="flex flex-col space-y-2 modal-box w-fit">
					<h1 class="text-bold">Share to:</h1>
					<div class="flex justify-center space-x-2 place-items-center">
						<Email
							class="flex justify-center w-12 h-12 overflow-hidden rounded-full place-items-center"
							subject="New Devotion from RevelationsAI"
							body={`Checkout the latest Devotion from RevelationsAI:\n\n${$page.url.toString()}`}
						/>
						<Facebook
							class="flex justify-center w-12 h-12 overflow-hidden rounded-full place-items-center"
							url={$page.url.toString()}
							quote="Checkout the latest devotion from RevelationsAI"
						/>
						<Twitter
							class="flex justify-center w-12 h-12 overflow-hidden rounded-full place-items-center"
							text="Checkout the latest devotion from RevelationsAI:"
							url={$page.url.toString()}
							hashtags="revelationsai,ai,christ,jesus"
						/>
					</div>
				</form>
				<form method="dialog" class="modal-backdrop">
					<button>close</button>
				</form>
			</dialog>
			<button
				on:click={() => shareModal?.showModal()}
				class="flex justify-center px-3 py-2 text-center text-white rounded-full place-items-center group bg-slate-300 hover:bg-slate-400 bg-opacity-90"
			>
				<Icon icon="lucide:share" width={20} height={20} />
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
		<h1 class="mb-2 text-2xl font-medium text-center lg:text-left">
			{cleanDate}
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
				<h2 class="mb-2 text-xl font-medium text-center lg:text-left">Reading</h2>
				<div class="flex flex-col w-full">
					{activeDevo.bibleReading}
				</div>
			</div>
		{/if}
		{#if activeDevo.summary}
			<div class="flex flex-col w-full mb-3 break-words whitespace-pre-wrap">
				<h2 class="mb-2 text-xl font-medium text-center lg:text-left">Summary</h2>
				<div class="flex flex-col w-full">{activeDevo.summary}</div>
			</div>
		{/if}
		{#if activeDevo.reflection}
			<div class="flex flex-col w-full mb-3 break-words whitespace-pre-wrap">
				<h2 class="mb-2 text-xl font-medium text-center lg:text-left">Reflection</h2>
				<div class="flex flex-col w-full">
					{activeDevo.reflection}
				</div>
			</div>
		{/if}
		{#if activeDevo.prayer}
			<div class="flex flex-col w-full mb-3 break-words whitespace-pre-wrap">
				<h2 class="mb-2 text-xl font-medium text-center lg:text-left">Prayer</h2>
				<div class="flex flex-col w-full">{activeDevo.prayer}</div>
			</div>
		{/if}
		{#if images && images.length > 0}
			<div class="flex flex-col w-full">
				<h2 class="mb-2 text-xl font-medium text-center lg:text-left">Generated Image(s)</h2>
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
				<h2 class="mb-2 font-medium">Sources</h2>
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
