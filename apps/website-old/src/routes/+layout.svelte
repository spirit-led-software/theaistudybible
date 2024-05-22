<script lang="ts">
  import { browser } from '$app/environment';
  import { Toaster } from '$lib/components/ui/sonner';
  import { session, user } from '$lib/stores/user';
  import { QueryClient, QueryClientProvider } from '@tanstack/svelte-query';
  import { ModeWatcher } from 'mode-watcher';
  import '../app.css';
  import '../fonts.css';
  import type { LayoutData } from './$types';

  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        enabled: browser
      }
    }
  });

  export let data: LayoutData;

  $: $user = data.user;
  $: $session = data.session;
</script>

<ModeWatcher />
<Toaster />
<QueryClientProvider client={queryClient}>
  <slot />
</QueryClientProvider>
