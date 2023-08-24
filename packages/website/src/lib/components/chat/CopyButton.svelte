<script lang="ts">
	import { cn } from '$lib/utils/class-names';
	import Icon from '@iconify/svelte';
	import { copy } from 'svelte-copy';

	/**
	 * Icon classes
	 */
	export let iconClass: string | undefined = undefined;

	/**
	 * Button classes
	 */
	export let btnClass: string | undefined = undefined;

	/**
	 * Content to copy
	 */
	export let content: string;

	let copied = false;

	$: if (copied) setTimeout(() => (copied = false), 2000);
</script>

<button
	use:copy={content}
	on:click={() => (copied = true)}
	class={cn(btnClass, 'text-slate-700 hover:text-slate-900')}
>
	<Icon
		icon={copied ? 'carbon:checkmark' : 'clarity:copy-to-clipboard-line'}
		width={16}
		height={16}
		class={cn(
			iconClass,
			`transition-transform duration-200 ${copied ? 'text-green-600 rotate-[360deg]' : 'rotate-0'}`
		)}
	/>
</button>
