<script lang="ts">
	import { user as userStore } from '$lib/stores/user';
	import { cn } from '@revelationsai/client/utils/class-names';
	import { type ComponentSize } from '@revelationsai/client/utils/sizing';
	import type { User } from '@revelationsai/core/model/user';

	export let size: ComponentSize = 'md';
	export let user: Partial<User> | undefined = undefined;

	let className: string = '';
	export { className as class };

	const textSizeClasses: {
		[key in ComponentSize]: string;
	} = {
		'3xs': 'text-3xs',
		'2xs': 'text-2xs',
		xs: 'text-xs',
		sm: 'text-sm',
		md: 'text-base',
		lg: 'text-lg',
		xl: 'text-xl',
		'2xl': 'text-2xl',
		'3xl': 'text-3xl',
		'4xl': 'text-4xl',
		'5xl': 'text-5xl',
		'6xl': 'text-6xl',
		'7xl': 'text-7xl',
		'8xl': 'text-8xl'
	};

	const squareDimensionClasses: {
		[key in ComponentSize]: string;
	} = {
		'3xs': 'w-2 h-2',
		'2xs': 'w-3 h-3',
		xs: 'w-4 h-4',
		sm: 'w-6 h-6',
		md: 'w-8 h-8',
		lg: 'w-12 h-12',
		xl: 'w-16 h-16',
		'2xl': 'w-24 h-24',
		'3xl': 'w-32 h-32',
		'4xl': 'w-40 h-40',
		'5xl': 'w-48 h-48',
		'6xl': 'w-56 h-56',
		'7xl': 'w-64 h-64',
		'8xl': 'w-72 h-72'
	};

	$: ({ image, name, email } = user ?? $userStore!);
</script>

<div
	class={cn(
		`flex flex-shrink-0 place-items-center justify-center overflow-hidden rounded-full bg-gray-300`,
		squareDimensionClasses[size],
		className
	)}
>
	{#if image}
		<img
			class="h-full w-full rounded-full"
			src={image}
			width={512}
			height={512}
			alt="avatar"
			on:error={() => {
				image = null;
			}}
		/>
	{:else}
		<div class={cn(`rounded-full uppercase text-white`, textSizeClasses[size])}>
			{name ? name[0] : email ? email[0] : '?'}
		</div>
	{/if}
</div>
