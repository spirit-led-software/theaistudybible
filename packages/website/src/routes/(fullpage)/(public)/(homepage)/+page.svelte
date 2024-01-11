<script lang="ts">
	import { PUBLIC_AUTH_URL } from '$env/static/public';
	import AskQuestionsBar from '$lib/components/AskQuestionsBar.svelte';
	import Logo from '$lib/components/branding/Logo.svelte';
	import Avatar from '$lib/components/user/Avatar.svelte';
	import Icon from '@iconify/svelte';
	import type { PageData } from './$types';

	export let data: PageData;
</script>

<svelte:head>
	<title>RevelationsAI: Home</title>
	<meta
		name="description"
		content="Discover Jesus Christ with the power of AI. Learn more about Jesus Christ, the Bible, and uncover mysteries of the Christian faith."
	/>
	<meta name="keywords" content="Jesus, Christ, Revelations, AI, Artificial Intelligence" />
</svelte:head>

<div
	class="bg-gradient-to-t from-slate-900 to-slate-600 text-white carousel carousel-vertical h-screen"
>
	<div class="h-full carousel-item">
		<div
			class="relative flex flex-col w-full h-full space-y-2 p-10 place-items-center justify-center"
		>
			<div class="flex justify-center w-5/6 mb-2 place-items-center lg:w-2/3 xl:w-1/2">
				<Logo size="5xl" colorscheme="light" />
			</div>
			<div class="flex justify-center w-5/6 lg:w-2/3 xl:w-1/2">
				<h1 class="p-2 text-base text-center text-white lg:text-xl">
					An all new way to discover Jesus Christ with the power of{' '}
					<span
						class="inline-block font-bold text-transparent bg-gradient-to-t from-blue-50 to-blue-400 bg-clip-text"
					>
						AI
					</span>
				</h1>
			</div>

			<div
				class="flex flex-col items-center justify-center w-5/6 space-y-4 text-center lg:w-2/3 xl:w-1/2"
			>
				<AskQuestionsBar />
				<div class="flex flex-wrap place-items-center justify-center space-y-1 text-xs lg:text-sm">
					{#if !data.user}
						<a
							href={`${PUBLIC_AUTH_URL}/sign-in`}
							class="flex text-blue-200 hover:underline place-items-center justify-center mx-2"
						>
							<Icon icon="mdi:login" class="mr-1" />
							Login
						</a>
					{:else}
						<a
							href={`${PUBLIC_AUTH_URL}/logout`}
							class="flex text-blue-200 hover:underline place-items-center justify-center mx-2"
						>
							<Avatar size="xs" />
							Logout
						</a>
					{/if}
					<a
						href="/chat"
						class="flex text-blue-200 hover:underline place-items-center justify-center mx-2"
					>
						<Icon icon="mdi:chat" class="mr-1" />
						Chat
					</a>
					<a
						href="/devotions"
						class="flex text-blue-200 hover:underline place-items-center justify-center mx-2"
					>
						<Icon icon="mdi:book-open-page-variant" class="mr-1" />
						Devotions
					</a>
					<a
						href="/search"
						class="flex text-blue-200 hover:underline place-items-center justify-center mx-2"
					>
						<Icon icon="mdi:magnify" class="mr-1" />
						Resource Search
					</a>
					<a
						href="/upgrade"
						class="flex text-blue-200 hover:underline place-items-center justify-center mx-2"
					>
						<Icon icon="mdi:account-credit-card" class="mr-1" />
						Upgrade
					</a>
					<a
						href="/privacy-policy"
						class="flex text-blue-200 hover:underline place-items-center justify-center mx-2"
					>
						<Icon icon="mdi:shield-account" class="mr-1" />
						Privacy Policy
					</a>
				</div>
			</div>
			<h2 class="flex flex-col justify-center pt-5 text-white place-items-end md:flex-row">
				It's even better on mobile.
			</h2>
			<div class="flex items-center justify-center w-2/3 text-white lg:w-1/3">
				<a href="https://apps.apple.com/us/app/revelationsai/id6463644660" target="_blank">
					<img
						src="/app-store-badge.svg"
						alt="Download on the App Store"
						width={400}
						class="w-32 lg:w-48"
					/>
				</a>
				<a
					href="https://play.google.com/store/apps/details?id=com.passgoco.revelationsai&pli=1"
					target="_blank"
				>
					<img
						src="/google-play-badge.png"
						alt="Download on the Google Play Store"
						width={500}
						class="w-40 lg:w-64"
					/>
				</a>
			</div>
			<div class="absolute bottom-2">
				<Icon icon="mdi:chevron-down" class="flex flex-col w-10 h-10 align-bottom animate-bounce" />
			</div>
		</div>
	</div>
	<div class="h-full carousel-item">
		<div
			class="relative flex flex-col w-full h-full justify-center place-items-center p-5 text-center lg:px-64"
		>
			<Icon icon="carbon:chat" class="w-10 h-10 lg:w-20 lg:h-20" />
			<h2
				class="text-lg inline-block font-bold text-transparent bg-gradient-to-t from-blue-50 to-blue-400 bg-clip-text mt-5 lg:text-2xl"
			>
				Faith Unveiled Through AI Chat
			</h2>
			<p class="mt-3 text-xs lg:text-base">
				Explore Christian theology like never before with our AI chat. Gain profound insights into
				the Bible through personalized conversations. Embrace the fusion of cutting-edge technology
				and divine wisdom for a deeper spiritual journey. Elevate your faith experience in our
				app—where AI meets theology.
			</p>
			<a href="/chat" class="mt-5 text-sm text-blue-300 hover:underline">Try it now</a>
		</div>
	</div>
	<div class="h-full carousel-item">
		<div
			class="relative flex flex-col w-full h-full justify-center place-items-center p-5 text-center lg:px-64"
		>
			<Icon icon="mdi:hands-pray" class="w-10 h-10 lg:w-20 lg:h-20" />
			<h2
				class="text-lg inline-block font-bold text-transparent bg-gradient-to-t from-blue-50 to-blue-400 bg-clip-text mt-5 lg:text-2xl"
			>
				AI-Driven Daily Devotions for Spiritual Enrichment
			</h2>
			<p class="mt-3 text-xs lg:text-base">
				Immerse yourself in daily inspiration with our AI-crafted devotions. Uncover personalized
				messages tailored to uplift your spirit and deepen your connection with faith. Let
				artificial intelligence curate meaningful reflections, fostering a daily ritual of spiritual
				growth. Elevate your devotionals to a new level—where technology meets the sacred, bringing
				you closer to the heart of your beliefs every day.
			</p>
			<a href="/devotions" class="mt-5 text-sm text-blue-300 hover:underline">View latest</a>
		</div>
	</div>
	<div class="h-full carousel-item">
		<div
			class="relative flex flex-col w-full h-full justify-center place-items-center p-5 text-center lg:px-64"
		>
			<Icon icon="mdi:book-check-outline" class="w-10 h-10 lg:w-20 lg:h-20" />
			<h2
				class="text-lg inline-block font-bold text-transparent bg-gradient-to-t from-blue-50 to-blue-400 bg-clip-text mt-5 lg:text-2xl"
			>
				Content You Can Trust
			</h2>
			<p class="mt-3 text-xs lg:text-base">
				Think of our app as your own spiritual guide infused with the wisdom of the ages. Retrieval
				augmented generation (RAG) in our app means that our AI doesn't just generate content from
				scratch. It retrieves relevant insights from a vast knowledge base and crafts personalized
				daily devotions just for you. It's like having an ancient library at its digital fingertips,
				pulling out the perfect nuggets of wisdom to inspire and guide you on your daily spiritual
				journey. In a nutshell, it's the seamless blend of timeless knowledge and cutting-edge tech,
				creating a uniquely tailored experience for your soul.
			</p>
		</div>
	</div>
</div>
