<script lang="ts">
	import { PUBLIC_AUTH_URL } from '$env/static/public';
	import AskQuestionsBar from '$lib/components/AskQuestionsBar.svelte';
	import Logo from '$lib/components/branding/Logo.svelte';
	import LogoIcon from '$lib/components/branding/LogoIcon.svelte';
	import type { PageData } from './$types';

	export let data: PageData;
</script>

<svelte:head>
	<title>RevelationsAI: Home</title>
</svelte:head>

<div
	class="flex flex-col items-center justify-center w-full min-h-full bg-gradient-to-b from-slate-950 to-slate-600"
>
	<div class="flex flex-col w-full space-y-2 place-items-center">
		<div class="flex justify-center w-3/4 mb-2 place-items-center lg:w-1/2">
			<LogoIcon size={'2xl'} class="rounded-full shadow-lg" />
		</div>
		<div class="flex justify-center w-1/2 xl:w-1/3">
			<h2 class="p-2 text-md text-center text-white lg:text-xl">
				An all new way to discover Jesus Christ with the power of{' '}
				<span
					class="inline-block font-bold text-transparent bg-gradient-to-t from-blue-50 to-blue-400 bg-clip-text"
				>
					Artificial Intelligence
				</span>
			</h2>
		</div>

		<div
			class="flex flex-col items-center justify-center w-5/6 space-y-4 text-center lg:w-1/2 xl:w-1/3"
		>
			<AskQuestionsBar />
			<div
				class="flex flex-col items-center justify-between w-full space-x-0 space-y-2 md:space-y-0 md:flex-row md:space-x-2"
			>
				<a
					href={'/chat'}
					class="flex w-full p-2 text-center bg-blue-300 rounded-md hover:text-white place-content-center hover:bg-blue-400 active:bg-blue-400 hover:shadow-lg"
				>
					See Chats
				</a>
				<a
					href={'/devotions'}
					class="flex w-full p-2 text-center bg-blue-300 rounded-md hover:text-white place-content-center hover:bg-blue-400 active:bg-blue-400 hover:shadow-lg"
				>
					See Devotions
				</a>
				<a
					href={data.user ? `${PUBLIC_AUTH_URL}/logout` : `${PUBLIC_AUTH_URL}/sign-in`}
					class="flex w-full p-2 text-center bg-blue-300 rounded-md hover:text-white place-content-center hover:bg-blue-400 active:bg-blue-400 hover:shadow-lg"
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
		<h1 class="flex justify-center pt-5 text-white place-items-end">
			<Logo colorscheme="light" /> is even better on mobile.
		</h1>
		<div class="flex items-center justify-center w-1/3 text-white">
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
