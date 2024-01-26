<script lang="ts">
	import { cn } from '@revelationsai/client/utils/class-names';
	import { cva, type VariantProps } from 'class-variance-authority';

	const dotsVariants = cva('rounded-full animate-pulse transition duration-700 ease-in-out', {
		variants: {
			size: {
				sm: 'h-1 w-1 mx-0.5',
				md: 'h-2 w-2 mx-1',
				lg: 'h-4 w-4 mx-2'
			},
			colorscheme: {
				dark: 'bg-slate-800',
				light: 'bg-slate-200'
			}
		},
		defaultVariants: {
			size: 'md',
			colorscheme: 'dark'
		}
	});

	interface DotsProps extends VariantProps<typeof dotsVariants> {}

	export let { colorscheme, size }: DotsProps = {};

	let className: string | undefined = undefined;
	export { className as class };
</script>

<div class={cn(className, 'flex flex-row')}>
	<div class={cn(dotsVariants({ colorscheme, size, className }))} />
	<div class={cn(dotsVariants({ colorscheme, size, className }), 'delay-300')} />
	<div class={cn(dotsVariants({ colorscheme, size, className }), 'delay-500')} />
</div>
