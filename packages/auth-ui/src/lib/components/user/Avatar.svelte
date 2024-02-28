<script lang="ts">
	import { user } from '$lib/stores/user';
	import { cn } from '@revelationsai/client/utils/class-names';
	import {
		squareDimensionClasses,
		textSizeClasses,
		type ComponentSize
	} from '@revelationsai/client/utils/sizing';

	export let size: ComponentSize = 'md';

	let className: string | undefined = undefined;
	export { className as class };

	$: ({ image, name, email } = $user!);
</script>

<div class="relative">
	<div
		class="absolute bottom-1 right-1 flex h-6 w-6 flex-col place-items-center justify-center rounded-full bg-blue-300 p-2 text-white"
	>
		<slot />
	</div>
	<div
		class={cn(
			`flex place-items-center justify-center overflow-hidden rounded-full bg-gray-300`,
			squareDimensionClasses[size],
			className
		)}
	>
		{#if image}
			<img
				class="h-full w-full rounded-full"
				src={image}
				width={192}
				height={192}
				alt="avatar"
				on:error={() => {
					image = null;
				}}
			/>
		{:else}
			<div class={cn('rounded-full uppercase text-white', textSizeClasses[size])}>
				{name ? name[0] : email ? email[0] : '?'}
			</div>
		{/if}
	</div>
</div>
