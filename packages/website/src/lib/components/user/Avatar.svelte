<script lang="ts">
	import { cn } from '$lib/utils/class-names';
	import { squareDimensionClasses, type ComponentSize } from '$lib/utils/sizing';
	import type { UserWithRoles } from '@core/model';

	export let user: UserWithRoles;
	export let size: ComponentSize = 'md';

	let className: string = '';
	export { className as class };

	$: ({ image, name, email } = user);
</script>

<div
	class={cn(
		`flex flex-col flex-grow-0 flex-shrink-0 justify-center place-items-center overflow-hidden rounded-full bg-gray-300 ${squareDimensionClasses[size]}`,
		className
	)}
>
	{#if image}
		<img
			class="w-full h-full rounded-full"
			src={image}
			width={192}
			height={192}
			alt="avatar"
			on:error={() => {
				image = null;
			}}
		/>
	{:else}
		<div class="text-xl font-medium text-white uppercase rounded-full">
			{name ? name[0] : email ? email[0] : '?'}
		</div>
	{/if}
</div>
