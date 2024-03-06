<script lang="ts">
  import { browser } from '$app/environment';
  import { session, user } from '$lib/stores/user';
  import { QueryClient, QueryClientProvider } from '@tanstack/svelte-query';
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

<QueryClientProvider client={queryClient}>
  <div class="flex h-screen flex-col">
    <slot />
  </div>
</QueryClientProvider>
