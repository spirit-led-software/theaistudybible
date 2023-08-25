<script lang="ts">
	import { page } from '$app/stores';
	import { getDevotions } from '$lib/services/devotion';
	import type { Devotion } from '@core/model';
	import Icon from '@iconify/svelte';
	import { createQuery } from '@tanstack/svelte-query';
	import Moment from 'moment';

	export let initDevos: Devotion[] = [];
	export let activeDevoId: string;

	let isOpen = false;
	let limit = 5;
	let devotions: Devotion[] = [];
	let isLoadingInitial = false;
	let isLoadingMore = false;
	let loadingDevoId: string | undefined = undefined;

	$: query = createQuery({
		queryKey: ['devos'],
		queryFn: () => getDevotions({ limit }).then((r) => r.devotions),
		initialData: initDevos
	});

	$: query?.subscribe(({ data, isLoading, isFetching }) => {
		devotions = data ?? [];

		if ((isLoading || isFetching) && devotions.length === 0) {
			isLoadingInitial = true;
		} else {
			isLoadingInitial = false;
		}

		if ((isLoading || isFetching) && limit > devotions.length) {
			isLoadingMore = true;
		} else {
			isLoadingMore = false;
		}
	});

	$: if ($page.url.pathname) {
		isOpen = false;
		loadingDevoId = undefined;
	}
</script>

<div
	class={`absolute flex h-full max-h-full bg-slate-700 border-t-2 duration-300 z-30 lg:w-2/5 lg:static ${
		isOpen ? 'w-full' : 'w-0'
	}`}
>
	<div class="relative flex flex-col w-full h-full">
		<button
			class={`absolute top-2 p-1 z-40 rounded-full bg-white border border-slate-700 cursor-pointer duration-300 lg:hidden ${
				isOpen ? 'rotate-0 right-2' : 'rotate-180 -right-10 opacity-75'
			}`}
			on:click|preventDefault={() => (isOpen = !isOpen)}
		>
			<Icon icon="formkit:arrowleft" height={20} width={20} />
		</button>
		<div
			class={`h-full w-full overflow-y-scroll py-4 px-6 text-white lg:px-2 lg:visible ${
				isOpen ? 'visible' : 'invisible'
			}`}
		>
			<h1 class="px-2 mb-3 text-2xl font-medium">All Devotions</h1>
			<div class="flex flex-col content-center w-full space-y-2">
				{#if isLoadingInitial}
					<div class="flex justify-center w-full">
						<div class="flex items-center justify-center py-5">
							<span class="loading loading-spinner loading-lg" />
						</div>
					</div>
				{/if}
				{#if $query.isSuccess}
					{#each devotions as devotion (devotion.id)}
						<div
							class={`flex place-items-center px-3 py-1 rounded-md cursor-pointer duration-200 justify-between hover:bg-slate-900 active:bg-slate-900 ${
								devotion.id === activeDevoId && 'bg-slate-800'
							}`}
						>
							<a
								href={`/devotions/${devotion.id}`}
								class="flex flex-col text-lg truncate"
								on:click={() => {
									if (activeDevoId === devotion.id) {
										isOpen = false;
										return;
									}
									loadingDevoId = devotion.id;
								}}
							>
								<div>{Moment(devotion.createdAt).format('MMMM Do YYYY')}</div>
								<div class="text-xs">
									{devotion.bibleReading.split(' - ')[0]}
								</div>
							</a>
							<div class="flex justify-center place-items-center">
								{#if loadingDevoId === devotion.id}
									<div class="flex justify-center place-items-center">
										<span class="loading loading-spinner loading-xs" />
									</div>
								{/if}
							</div>
						</div>
					{/each}
					{#if !isLoadingMore && devotions.length >= limit}
						<button
							class="flex justify-center py-2 text-center border border-white rounded-lg hover:bg-slate-900"
							on:click|preventDefault={() => (limit = limit + 5)}
						>
							View more
						</button>
					{:else if isLoadingMore}
						<div class="flex justify-center w-full">
							<div class="flex items-center justify-center py-5">
								<span class="loading loading-spinner loading-md" />
							</div>
						</div>
					{/if}
				{:else if $query.isError}
					<div>
						Error fetching devotions: {$query.error}
					</div>
				{/if}
			</div>
		</div>
	</div>
</div>
