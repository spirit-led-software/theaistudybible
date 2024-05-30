<script lang="ts">
  import { Toaster } from '$lib/components/ui/sonner';
  import { QueryClientProvider } from '@tanstack/svelte-query';
  import { ModeWatcher } from 'mode-watcher';
  import '../app.css';
  import type { LayoutData } from './$types';

  export let data: LayoutData;
</script>

<QueryClientProvider client={data.queryClient}>
  <ModeWatcher />
  <Toaster />
  <slot />
</QueryClientProvider>
