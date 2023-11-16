<script lang="ts">
	import Logo from './branding/Logo.svelte';
</script>

<footer
	class="flex flex-col justify-center px-10 py-5 text-xs bg-gray-100 lg:justify-around lg:flex-row"
>
	<div class="flex flex-col mb-10 space-y-2 text-center lg:text-start lg:mb-0">
		<a href="/privacy-policy" class="text-gray-400 hover:underline">Privacy Policy</a>
		<a href="mailto:support@revelationsai.com" class="text-gray-400 hover:underline">Contact Us</a>
		<a
			href=" https://www.buymeacoffee.com/ianpascoe"
			target="_blank"
			class="text-gray-400 hover:underline">Buy Me a Coffee</a
		>
	</div>
	<div class="flex flex-col justify-center place-items-center">
		<h1 class="text-lg font-medium">
			<Logo colorscheme="dark" class="font-light" /> is even better on mobile.
		</h1>
		<div class="flex flex-col justify-center place-items-center lg:flex-row">
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
</footer>
