<script lang="ts">
  import type { Snippet } from 'svelte';

  type Props = {
    children: Snippet;
  };

  let { children }: Props = $props();
</script>

<div class="flex h-full w-full flex-col">
  {@render children()}
</div>
