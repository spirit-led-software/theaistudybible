<script lang="ts">
	import Cross from '$lib/components/branding/Cross.svelte';
	import Logo from '$lib/components/branding/Logo.svelte';
</script>

<div
	class="flex h-full place-items-center place-content-center bg-slate-100 lg:place-items-end lg:place-content-end"
>
	<div class="justify-center flex-1 hidden h-full place-items-center lg:flex lg:visible">
		<div class="flex flex-col justify-center w-full space-y-4 place-items-center">
			<div class="flex flex-col justify-center w-3/4 place-items-center">
				<Cross size="8xl" colorscheme="dark" />
				<Logo size={'6xl'} colorscheme={'dark'} class="lg:text-8xl" />
			</div>
		</div>
	</div>
	<slot />
</div>
