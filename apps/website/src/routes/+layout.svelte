<script lang="ts">
  import NavigationHeader from '$lib/components/nav/header.svelte';
  import { Toaster } from '$lib/components/ui/sonner';
  import { createRpcClient } from '$lib/runes/rpc.svelte';
  import { QueryClientProvider } from '@tanstack/svelte-query';
  import { ModeWatcher } from 'mode-watcher';
  import { type Snippet } from 'svelte';
  import '../app.css';
  import type { LayoutData } from './$types';

  type Props = {
    data: LayoutData;
    children: Snippet;
  };

  let { data, children }: Props = $props();

  $effect(() => {
    createRpcClient(data.rpcClient);
  });
</script>

<QueryClientProvider client={data.queryClient}>
  <ModeWatcher />
  <Toaster />
  <NavigationHeader />
  {#if children}
    {@render children()}
  {/if}
</QueryClientProvider>
