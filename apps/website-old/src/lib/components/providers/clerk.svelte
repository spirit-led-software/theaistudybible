<script lang="ts">
  import { Clerk } from '@clerk/clerk-js';
  import { onMount, setContext, type Snippet } from 'svelte';

  type Props = {
    publishableKey: string;
    children: Snippet;
  };

  let { publishableKey, children }: Props = $props();

  const clerk = new Clerk(publishableKey);
  setContext('$$_clerk', clerk);

  onMount(() => {
    clerk.load();
  });
</script>

{@render children()}
