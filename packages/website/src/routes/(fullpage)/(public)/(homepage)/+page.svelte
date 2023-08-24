<script lang="ts">
	import AskQuestionsBar from '$lib/components/AskQuestionsBar.svelte';
	import Logo from '$lib/components/branding/Logo.svelte';
	import type { PageData } from './$types';

	export let data: PageData;
</script>

<svelte:head>
	<title>RevelationsAI: Home</title>
</svelte:head>

<div class="flex flex-col items-center justify-center w-full h-full">
	<div class="flex flex-col w-full space-y-4 place-items-center">
		<div class="flex justify-center w-3/4 place-items-center md:w-1/2">
			<Logo size={'6xl'} colorscheme={'dark'} class="lg:text-8xl" />
		</div>
		<div class="flex justify-center w-3/4 md:w-1/2">
			<h2 class="p-2 text-xl text-center text-slate-800 md:text-2xl lg:text-3xl">
				An all new way to discover Jesus Christ with the power of{' '}
				<span class="text-blue-300">Artificial Intelligence</span>
			</h2>
		</div>
		{#if data.user}
			<div class="flex flex-col items-center justify-center w-5/6 space-y-4 text-center md:w-2/5">
				<AskQuestionsBar />
				<div
					class="flex flex-col items-center justify-center w-full space-y-2 md:space-x-2 md:space-y-0 md:flex-row md:w-1/2"
				>
					<a
						href={'/chat'}
						class="w-full py-3 text-white rounded-md grow-0 shrink-0 bg-slate-700 hover:bg-slate-900 hover:shadow-lg"
					>
						See Chats
					</a>
					<a
						href={'/devotions'}
						class="w-full py-3 text-white rounded-md grow-0 shrink-0 bg-slate-700 hover:bg-slate-900 hover:shadow-lg"
					>
						See Devotions
					</a>
				</div>
			</div>
		{:else}
			<div
				class="flex flex-col justify-center w-2/3 space-y-2 text-center place-items-center md:space-y-0 md:w-2/5 md:space-x-2 md:flex-row"
			>
				<a
					href={'/chat'}
					class="w-full py-3 text-white rounded-md bg-slate-700 hover:bg-slate-900 hover:shadow-lg"
				>
					See Chats
				</a>
				<a
					href={'/devotions'}
					class="w-full py-3 text-white rounded-md bg-slate-700 hover:bg-slate-900 hover:shadow-lg"
				>
					See Devotions
				</a>
				<a
					href={'/auth/login'}
					class="w-full py-3 text-white rounded-md bg-slate-700 hover:bg-slate-900 hover:shadow-lg"
				>
					Login
				</a>
			</div>
		{/if}
	</div>
</div>
