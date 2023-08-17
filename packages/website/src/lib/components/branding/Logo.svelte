<script lang="ts">
	import { cn } from '$lib/utils/class-names';
	import { textSizeClasses } from '$lib/utils/sizing';
	import { cva, type VariantProps } from 'class-variance-authority';

	const logoVariants = cva('inline-flex items-center font-catamaran', {
		variants: {
			size: {
				'2xs': textSizeClasses['2xs'],
				xs: textSizeClasses.xs,
				sm: textSizeClasses.sm,
				md: textSizeClasses.md,
				lg: textSizeClasses.lg,
				xl: textSizeClasses.xl,
				'2xl': textSizeClasses['2xl'],
				'3xl': textSizeClasses['3xl'],
				'4xl': textSizeClasses['4xl'],
				'5xl': textSizeClasses['5xl'],
				'6xl': textSizeClasses['6xl'],
				'7xl': textSizeClasses['7xl'],
				'8xl': textSizeClasses['8xl']
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

	interface LogoProps extends VariantProps<typeof logoVariants> {}

	export let { colorscheme, size }: LogoProps = {};

	let className: string | undefined = undefined;
	export { className as class };
</script>

<div class={cn(logoVariants({ size, colorscheme, className }))}>
	<span>revelations</span>
	<span class="text-blue-300">AI</span>
</div>
