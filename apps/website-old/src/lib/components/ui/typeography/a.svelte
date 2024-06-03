<script lang="ts">
  import type { HTMLAttributes } from 'svelte/elements';

  let {
    children,
    href,
    ...props
  }: HTMLAttributes<HTMLAnchorElement> & {
    href: string;
  } = $props();
</script>

<a {...props} class="text-primary underline" {href}>
  {#if children}
    {@render children()}
  {/if}
</a>
