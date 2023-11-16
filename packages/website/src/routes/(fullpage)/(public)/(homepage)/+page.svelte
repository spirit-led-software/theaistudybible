<script lang="ts">
	import AskQuestionsBar from '$lib/components/AskQuestionsBar.svelte';
	import CompactLogo from '$lib/components/branding/CompactLogo.svelte';
	import Logo from '$lib/components/branding/Logo.svelte';
	import type { PageData } from './$types';

	export let data: PageData;
</script>

<svelte:head>
	<title>RevelationsAI: Home</title>
</svelte:head>

<div
	class="flex flex-col items-center justify-center w-full h-full bg-gradient-to-b from-slate-900 to-blue-100"
>
	<div class="flex flex-col w-full space-y-2 place-items-center">
		<div class="flex justify-center w-3/4 -mb-5 place-items-center lg:w-1/2">
			<CompactLogo size={'7xl'} colorscheme={'light'} />
		</div>
		<div class="flex justify-center w-1/2">
			<h2 class="p-2 text-xl text-center text-white lg:text-2xl">
				An all new way to discover Jesus Christ with the power of{' '}
				<span class="text-blue-300">Artificial Intelligence</span>
			</h2>
		</div>

		<div class="flex flex-col items-center justify-center w-5/6 space-y-4 text-center lg:w-1/2">
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
		<a href="/privacy-policy" class="text-sm text-gray-200 hover:underline">Privacy Policy</a>
		<h1 class="pt-5 font-medium">
			<Logo colorscheme="dark" class="font-light" /> is even better on mobile.
		</h1>
		<div class="flex items-center justify-center w-1/3">
			<a href="https://apps.apple.com/us/app/revelationsai/id6463644660" target="_blank">
				<img src="/app-store-badge.svg" alt="Download on the App Store" width="150" />
			</a>
			<a
				href="https://play.google.com/store/apps/details?id=com.passgoco.revelationsai&pli=1"
				target="_blank"
			>
				<img src="/google-play-badge.png" alt="Download on the Google Play Store" width="200" />
			</a>
		</div>
	</div>
</div>
