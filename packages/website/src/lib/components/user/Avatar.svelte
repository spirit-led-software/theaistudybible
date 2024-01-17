<script lang="ts">
	import { user as userStore } from '$lib/stores/user';
	import { cn } from '$lib/utils/class-names';
	import { squareDimensionClasses, textSizeClasses, type ComponentSize } from '$lib/utils/sizing';
	import type { User } from '@core/model/user';

	export let size: ComponentSize = 'md';
	export let user: User | undefined = undefined;

	let sizeClasses = squareDimensionClasses[size];

	let className: string = '';
	export { className as class };

	$: ({ image, name, email } = user ?? $userStore!);
</script>

<div
	class={cn(
		`flex justify-center place-items-center overflow-hidden rounded-full bg-gray-300`,
		sizeClasses,
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
		<div class={cn('text-white uppercase rounded-full', textSizeClasses[size])}>
			{name ? name[0] : email ? email[0] : '?'}
		</div>
	{/if}
</div>
