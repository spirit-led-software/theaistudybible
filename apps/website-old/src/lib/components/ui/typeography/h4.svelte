<script lang="ts">
  import { cn } from '$lib/utils';
  import type { HTMLAttributes } from 'svelte/elements';

  let { children, ...props }: HTMLAttributes<HTMLHeadingElement> = $$props;
</script>

<h4 {...props} class={cn('scroll-m-20 text-xl font-semibold tracking-tight', props.class)}>
  {#if children}
    {@render children()}
  {/if}
</h4>
