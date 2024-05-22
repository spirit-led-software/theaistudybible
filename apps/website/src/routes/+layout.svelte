<script lang="ts">
  import { QueryClientProvider } from '@tanstack/svelte-query';
  import '../app.css';
  import type { LayoutData } from './$types';

  export let data: LayoutData;

  const queryClient = data.queryClient;
</script>

<QueryClientProvider client={queryClient}>
  <slot />
</QueryClientProvider>
