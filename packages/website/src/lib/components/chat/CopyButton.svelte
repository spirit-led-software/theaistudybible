<script lang="ts">
	import { cn } from '$lib/utils/class-names';
	import Icon from '@iconify/svelte';
	import { Tooltip } from 'flowbite-svelte';
	import { copy } from 'svelte-copy';

	let className: string = '';
	export { className as class };
	export let content: string;
	export let id: string;

	let copied = false;

	$: if (copied) setTimeout(() => (copied = false), 2000);
</script>

<Tooltip type="dark" triggeredBy={`#${id}`} placement="top-start">
	<div class="text-slate-700">Copy response</div>
</Tooltip>
<button {id} use:copy={content} on:click={() => (copied = true)} {...$$restProps}>
	<Icon
		icon={copied ? 'carbon:checkmark' : 'clarity:copy-to-clipboard-line'}
		width={20}
		height={20}
		class={cn(
			className,
			`transition-transform duration-200 ${copied ? 'text-green-600 rotate-[360deg]' : 'rotate-0'}`
		)}
	/>
</button>
