<script lang="ts">
	import Logo from '$lib/components/branding/Logo.svelte';
	import Iconify from '@iconify/svelte';
</script>

<div
	class="flex flex-col flex-1 place-items-center place-content-center bg-slate-100 lg:place-items-end lg:place-content-end"
>
	<div class="fixed top-0 bottom-0 left-0 invisible right-96 lg:visible">
		<div class="flex flex-col items-center justify-center w-full h-full">
			<div class="flex flex-col w-full space-y-4 place-items-center">
				<div class="flex flex-col justify-center w-3/4 place-items-center">
					<Iconify icon="mdi:cross" class="text-6xl" />
					<Logo size={'6xl'} colorscheme={'dark'} class="lg:text-8xl" />
				</div>
			</div>
		</div>
	</div>
	<slot />
</div>
