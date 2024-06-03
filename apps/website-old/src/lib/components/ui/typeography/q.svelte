<script lang="ts">
  import { cn } from '$lib/utils';
  import type { HTMLAttributes } from 'svelte/elements';

  let { children, ...props }: HTMLAttributes<HTMLQuoteElement> = $props();
</script>

<blockquote {...props} class={cn('mt-6 border-l-2 pl-6 italic', props.class)}>
  {#if children}
    {@render children()}
  {/if}
</blockquote>
