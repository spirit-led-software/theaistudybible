<script lang="ts">
	import { user } from '$lib/stores/user';
	import { cn } from '@revelationsai/client/utils/class-names';
	import {
		squareDimensionClasses,
		textSizeClasses,
		type ComponentSize
	} from '@revelationsai/client/utils/sizing';

	export let size: ComponentSize = 'md';

	let sizeClasses = squareDimensionClasses[size];

	let className: string | undefined = undefined;
	export { className as class };

	$: ({ image, name, email } = $user!);
</script>

<div class="relative">
	<div
		class="absolute flex flex-col bottom-1 right-1 bg-blue-300 rounded-full p-2 text-white w-6 h-6 place-items-center justify-center"
	>
		<slot />
	</div>
	<div
		class={cn(
			`flex justify-center place-items-center overflow-hidden rounded-full bg-gray-300 ${sizeClasses}`,
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
</div>
