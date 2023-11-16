<script lang="ts">
	import Logo from '$lib/components/branding/Logo.svelte';
</script>

<div
	class="flex h-full place-items-center place-content-center bg-slate-700 lg:place-items-end lg:place-content-end"
>
	<div class="justify-center flex-1 hidden h-full place-items-center lg:flex lg:visible">
		<div class="flex flex-col justify-center w-full space-y-4 place-items-center">
			<div class="flex flex-col justify-center w-3/4 place-items-center">
				<Logo size={'7xl'} colorscheme={'light'} />
			</div>
		</div>
	</div>
	<slot />
</div>
