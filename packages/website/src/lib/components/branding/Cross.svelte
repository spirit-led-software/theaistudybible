<script lang="ts">
	import { cn } from '$lib/utils/class-names';
	import { squareDimensionClasses, squareDimensions } from '$lib/utils/sizing';
	import Icon from '@iconify/svelte';
	import { cva, type VariantProps } from 'class-variance-authority';
	import type { HTMLAttributes } from 'svelte/elements';

	const crossVariants = cva('inline-flex items-center font-catamaran', {
		variants: {
			size: {
				'3xs': squareDimensionClasses['3xs'],
				'2xs': squareDimensionClasses['2xs'],
				xs: squareDimensionClasses.xs,
				sm: squareDimensionClasses.sm,
				md: squareDimensionClasses.md,
				lg: squareDimensionClasses.lg,
				xl: squareDimensionClasses.xl,
				'2xl': squareDimensionClasses['2xl'],
				'3xl': squareDimensionClasses['3xl'],
				'4xl': squareDimensionClasses['4xl'],
				'5xl': squareDimensionClasses['5xl'],
				'6xl': squareDimensionClasses['6xl'],
				'7xl': squareDimensionClasses['7xl'],
				'8xl': squareDimensionClasses['8xl']
			},
			colorscheme: {
				light: 'text-white',
				dark: 'text-slate-800'
			}
		},
		defaultVariants: {
			size: 'md',
			colorscheme: 'light'
		}
	});

	interface CrossProps extends VariantProps<typeof crossVariants>, HTMLAttributes<SVGAElement> {}

	export let { colorscheme, size }: CrossProps = {};

	$: width = squareDimensions[size ?? 'md'];
	$: height = squareDimensions[size ?? 'md'];

	let className: string | undefined = undefined;
	export { className as class };
</script>

<Icon
	icon="mdi:cross"
	class={cn(crossVariants({ size, colorscheme, className }))}
	{width}
	{height}
/>
