<script lang="ts">
  import { cn } from '$lib/utils';
  import type { HTMLAttributes } from 'svelte/elements';

  let { children, ...props }: HTMLAttributes<HTMLParagraphElement> = $$props;
</script>

<p {...props} class={cn('leading-7 [&:not(:first-child)]:mt-6', props.class)}>
  {#if children}
    {@render children()}
  {/if}
</p>
