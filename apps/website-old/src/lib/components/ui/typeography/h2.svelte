<script lang="ts">
  import { cn } from '$lib/utils';
  import type { HTMLAttributes } from 'svelte/elements';

  let { children, ...props }: HTMLAttributes<HTMLHeadingElement> = $props();
</script>

<h2
  {...props}
  class={cn(
    'scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight first:mt-0',
    props.class
  )}
>
  {#if children}
    {@render children()}
  {/if}
</h2>
