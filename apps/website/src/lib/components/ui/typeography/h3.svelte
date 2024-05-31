<script lang="ts">
  import type { HTMLAttributes } from 'svelte/elements';
  import { cn } from '$lib/utils';

  let { children, ...props }: HTMLAttributes<HTMLHeadingElement> = $$props;
</script>

<h3 {...props} class={cn('scroll-m-20 text-2xl font-semibold tracking-tight', props.class)}>
  {#if children}
    {@render children()}
  {/if}
</h3>
