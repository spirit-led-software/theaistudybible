<script lang="ts">
  import { PUBLIC_CLERK_PUBLISHABLE_KEY } from '$env/static/public';
  import NavigationHeader from '$lib/components/nav/header.svelte';
  import ClerkProvider from '$lib/components/providers/clerk.svelte';
  import RpcClientProvider from '$lib/components/providers/rpc-client.svelte';
  import { Toaster } from '$lib/components/ui/sonner';
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
</script>

<ClerkProvider publishableKey={PUBLIC_CLERK_PUBLISHABLE_KEY}>
  <QueryClientProvider client={data.queryClient}>
    <RpcClientProvider client={data.rpcClient}>
      <ModeWatcher />
      <Toaster />
      <NavigationHeader />
      {@render children()}
    </RpcClientProvider>
  </QueryClientProvider>
</ClerkProvider>
