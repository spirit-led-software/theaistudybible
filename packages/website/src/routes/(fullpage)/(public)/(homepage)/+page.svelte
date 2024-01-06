<script lang="ts">
	import AskQuestionsBar from '$lib/components/AskQuestionsBar.svelte';
	import Logo from '$lib/components/branding/Logo.svelte';
	import Icon from '@iconify/svelte';

	// export let data: PageData;
</script>

<svelte:head>
	<title>RevelationsAI: Home</title>
</svelte:head>

<div
	class="bg-gradient-to-t from-slate-900 to-slate-600 text-white carousel carousel-vertical h-screen"
>
	<div class="h-full carousel-item">
		<div
			class="relative flex flex-col w-full h-full space-y-2 p-10 place-items-center justify-center"
		>
			<div class="flex justify-center w-5/6 mb-2 place-items-center lg:w-1/2 xl:w-1/3">
				<Logo size="4xl" colorscheme="light" />
			</div>
			<div class="flex justify-center w-5/6 lg:w-1/2 xl:w-1/3">
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
			</div>
			<h1 class="flex flex-col justify-center pt-5 text-white place-items-end md:flex-row">
				It's even better on mobile.
			</h1>
			<div class="flex items-center justify-center w-1/2 text-white">
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
			<a href="/privacy-policy" class="text-sm text-gray-200 hover:underline">Privacy Policy</a>
			<div class="absolute bottom-2">
				<Icon icon="mdi:chevron-down" class="flex flex-col w-10 h-10 align-bottom animate-bounce" />
			</div>
		</div>
	</div>
	<div class="h-full carousel-item">
		<div
			class="relative flex flex-col w-full h-full justify-center place-items-center p-10 text-center lg:px-64"
		>
			<Icon icon="carbon:chat" class="w-20 h-20 text-white" />
			<h2
				class="text-2xl inline-block font-bold text-transparent bg-gradient-to-t from-blue-50 to-blue-400 bg-clip-text mt-5"
			>
				Faith Unveiled Through AI Chat
			</h2>
			<p class="mt-3">
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
			class="relative flex flex-col w-full h-full justify-center place-items-center p-10 text-center lg:px-64"
		>
			<Icon icon="mdi:hands-pray" class="w-20 h-20 mt-20" />
			<h2
				class="text-2xl inline-block font-bold text-transparent bg-gradient-to-t from-blue-50 to-blue-400 bg-clip-text mt-5"
			>
				AI-Driven Daily Devotions for Spiritual Enrichment
			</h2>
			<p class="mt-3">
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
			class="relative flex flex-col w-full h-full justify-center place-items-center p-10 text-center lg:px-64"
		>
			<Icon icon="mdi:book-check-outline" class="w-20 h-20" />
			<h2
				class="text-2xl inline-block font-bold text-transparent bg-gradient-to-t from-blue-50 to-blue-400 bg-clip-text mt-5"
			>
				Content You Can Trust
			</h2>
			<p class="mt-3">
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
