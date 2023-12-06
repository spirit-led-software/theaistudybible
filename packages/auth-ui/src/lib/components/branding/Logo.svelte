<script lang="ts">
	import { cn } from '$lib/utils/class-names';
	import type { ComponentSize } from '$lib/utils/sizing';

	export let size: ComponentSize = 'md';
	export let colorscheme: 'light' | 'dark' = 'light';

	let className: string | undefined = undefined;
	export { className as class };

	const dimensions: {
		[key in ComponentSize]: {
			width: number;
		};
	} = {
		'3xs': {
			width: 10
		},
		'2xs': {
			width: 40
		},
		xs: {
			width: 80
		},
		sm: {
			width: 120
		},
		md: {
			width: 160
		},
		lg: {
			width: 200
		},
		xl: {
			width: 240
		},
		'2xl': {
			width: 280
		},
		'3xl': {
			width: 320
		},
		'4xl': {
			width: 360
		},
		'5xl': {
			width: 400
		},
		'6xl': {
			width: 440
		},
		'7xl': {
			width: 480
		},
		'8xl': {
			width: 520
		}
	};
</script>

<img
	alt="Logo"
	src={`/logo-${colorscheme}.png`}
	width={dimensions[size].width}
	class={cn(className)}
/>
