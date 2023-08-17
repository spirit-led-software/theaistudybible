<script lang="ts">
	import autosize from 'autosize';

	const action = (node: HTMLTextAreaElement) => {
		autosize(node);

		return {
			destroy() {
				autosize.destroy(node);
			}
		};
	};

	action.update = autosize.update;
	action.destroy = autosize.destroy;
</script>

<textarea
	{...$$restProps}
	use:action
	aria-label="Type a message"
	placeholder="Type a message"
	rows={1}
	class="w-full py-1 overflow-hidden bg-transparent resize-none focus:outline-none"
/>
