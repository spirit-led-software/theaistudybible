<script lang="ts">
	import type { Writable } from 'svelte/store';

	export let input: Writable<string>;
	export let maxRows = 5;

	let textarea = null;
	let height = 120;
	let rows = 1;

	const resize = (node: HTMLTextAreaElement) => {
		const ro = new ResizeObserver((entries) => {
			for (const entry of entries) {
				const CR = entry.contentRect;
				const ET = entry.target;
				if (CR && ET) {
					node.dispatchEvent(
						new CustomEvent('resize', {
							detail: { CR, ET }
						})
					);
					break;
				}
			}
		});
		ro.observe(node);
		return {
			destroy() {
				ro.disconnect();
			}
		};
	};

	const onResize = (e: UIEvent) => {
		textarea = e.target;
		height = (e.target as any)?.CR?.height;
	};

	$: {
		const rowSize = ($input.match(/\n/g) || []).length + 1 || 1;
		if (rowSize > maxRows) {
			rows = maxRows;
		} else {
			rows = rowSize;
		}
	}
</script>

<textarea
	use:resize
	on:resize={onResize}
	aria-label="Type a message"
	placeholder="Type a message"
	{rows}
	class="w-full px-0 py-2 overflow-x-hidden overflow-y-scroll bg-transparent border-none outline-none resize-none focus:outline-none focus:border-none focus:ring-0"
	bind:value={$input}
	{...$$restProps}
/>
