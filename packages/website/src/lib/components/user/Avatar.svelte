<script lang="ts">
	import { cn } from '$lib/utils/class-names';
	import { squareDimensionClasses, type ComponentSize } from '$lib/utils/sizing';
	import type { UserWithRoles } from '@core/model';

	export let user: UserWithRoles;
	export let size: ComponentSize = 'md';

	let className: string | undefined = undefined;
	export { className as class };

	$: dimensions = squareDimensionClasses[size];
</script>

<div class={cn(`relative overflow-hidden rounded-full bg-gray-300 ${dimensions}`, className)}>
	{#if user.image}
		<img
			class="w-full h-full rounded-full"
			src={user.image}
			width={192}
			height={192}
			alt="avatar"
		/>
	{:else}
		<div
			class="absolute inset-0 flex items-center justify-center text-xl font-medium text-white uppercase rounded-full"
		>
			{user.name ? user.name[0] : user.email ? user.email[0] : '?'}
		</div>
	{/if}
</div>
