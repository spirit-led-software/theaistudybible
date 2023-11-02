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

		<div class="flex flex-col items-center justify-center w-5/6 space-y-4 text-center md:w-3/5">
			<AskQuestionsBar />
			<div
				class="flex flex-col items-center justify-between w-full space-x-0 space-y-2 md:space-y-0 md:flex-row md:space-x-2"
			>
				<a
					href={'/chat'}
					class="flex w-full p-2 text-center text-white rounded-md place-content-center bg-slate-700 hover:bg-slate-900 active:bg-slate-900 hover:shadow-lg"
				>
					See Chats
				</a>
				<a
					href={'/devotions'}
					class="flex w-full p-2 text-center text-white rounded-md place-content-center bg-slate-700 hover:bg-slate-900 active:bg-slate-900 hover:shadow-lg"
				>
					See Devotions
				</a>
				<a
					href={data.user ? '/auth/logout' : '/auth/login'}
					class="flex w-full p-2 text-center text-white rounded-md place-content-center bg-slate-700 hover:bg-slate-900 active:bg-slate-900 hover:shadow-lg"
				>
					{#if data.user}
						Logout
					{:else}
						Login
					{/if}
				</a>
			</div>
		</div>
		<a href="/privacy-policy" class="text-sm text-gray-400 hover:underline">Privacy Policy</a>
		<div
			class="flex flex-col items-center justify-between w-1/3 pt-5 space-x-0 space-y-2 md:space-y-0 md:flex-row md:space-x-2"
		>
			<a href="https://apps.apple.com/us/app/revelationsai/id6463644660" target="_blank">
				<img src="/app-store-badge.svg" alt="Download on the App Store" height="600" width="400" />
			</a>
			<a
				href="https://play.google.com/store/apps/details?id=com.passgoco.revelationsai&pli=1"
				target="_blank"
			>
				<img
					src="/google-play-badge.png"
					alt="Download on the Google Play Store"
					height="700"
					width="500"
				/>
			</a>
		</div>
	</div>
</div>
