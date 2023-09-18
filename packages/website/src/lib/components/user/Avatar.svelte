<script lang="ts">
	import { cn } from '$lib/utils/class-names';
	import { squareDimensionClasses, type ComponentSize } from '$lib/utils/sizing';
	import type { UserWithRoles } from '@core/model';

	export let user: UserWithRoles;
	export let size: ComponentSize = 'md';

	let className: string = '';
	export { className as class };
</script>

<div
	class={cn(
		`flex flex-col flex-grow-0 flex-shrink-0 justify-center place-items-center overflow-hidden rounded-full bg-gray-300 ${squareDimensionClasses[size]}`,
		className
	)}
>
	{#if user.image}
		<img
			class="w-full h-full rounded-full"
			src={user.image}
			width={192}
			height={192}
			alt="avatar"
		/>
	{:else}
		<div class="text-xl font-medium text-white uppercase rounded-full">
			{user.name ? user.name[0] : user.email ? user.email[0] : '?'}
		</div>
	{/if}
</div>
