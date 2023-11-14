<script lang="ts">
	import Logo from './branding/Logo.svelte';
</script>

<footer class="flex justify-between px-10 py-5 text-xs bg-gray-100">
	<div class="flex flex-col space-y-2">
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
		<div class="flex justify-center place-items-center">
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
