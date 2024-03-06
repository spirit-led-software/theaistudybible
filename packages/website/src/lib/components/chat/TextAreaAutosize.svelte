<script lang="ts">
  import autosize from 'autosize';
  import type { Writable } from 'svelte/store';

  export let input: Writable<string>;

  let textarea: HTMLTextAreaElement | undefined = undefined;

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

  $: if (!$input && textarea) {
    textarea.style.height = 'fit-content';
  }
</script>

<textarea
  bind:this={textarea}
  use:action
  aria-label="Type a message"
  placeholder="Type a message"
  rows={1}
  class="w-full resize-none overflow-hidden border-none bg-transparent px-0 py-2 outline-none focus:border-none focus:outline-none focus:ring-0"
  bind:value={$input}
  {...$$restProps}
/>
